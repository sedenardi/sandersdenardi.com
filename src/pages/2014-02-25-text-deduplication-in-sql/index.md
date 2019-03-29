---
title: Text Deduplication in SQL
date: 2014-02-25T12:25:24-05:00
author: Sanders
url: /text-deduplication-in-sql/
tags:
  - festival-guide
  - mysql
  - sql
---
Data deduplication is essential when importing similar data from different sources. Different providers store data differently, and several variations (both correct and incorrect) exist in the English language for names of people, companies, and entities in general. Deduplication is often made easier if there is a lot of other information associated with the data because it gives you several things to compare to identify a dupe (such as birthday for people, location for company, etc.). When you're trying to identify duplicate names only, things get a bit tricky.

For my purposes, I'm trying to deduplicate lists of musical artists that I've gathered from many different websites. A quick-and-dirty method of comparing unequal but similar strings is to strip out any special (i.e. non-alphanumerical) characters and then compare them. This is a fantastic technique because it is a (relatively) quick operation and yields very good results.

{{< highlight sql >}}
SELECT
  a1.artistId,
  a1.artist,
  a2.artistId,
  a2.artist
FROM artists a1
  INNER JOIN artists a2
  ON REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(a1.artist),'the ',''),'a ',''),'.',''),'& ',''),'and ',''),'-','') LIKE
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(a2.artist),'the ',''),'a ',''),'.',''),'& ',''),'and ',''),'-','');
{{< /highlight >}}

Note that I also remove articles because they are often omitted, and the word "and" because it could be interchanged with "&".

Now this technique finds dupes in a lot of cases, but not all. If one source omits an artist's nickname ("Damian Marley" vs "Damian 'Jr. Gong' Marley"), or a prefix in their name ("Lauryn Hill" vs "Ms. Lauryn Hill" vs "Miss Lauryn Hill"), this technique will not identify the duplicates.

Inspired by <a href="http://programmers.stackexchange.com/questions/107735/how-do-i-go-about-data-deduplication-at-scale" target="_blank">this post</a>, I decided to build a table of rolling hashes and use the number of hits for different artists to identify duplicates. <a href="http://en.wikipedia.org/wiki/Rolling_hash" target="_blank">Rolling hashes</a> move a window of fixed length through a string to generate small hashes for comparison. Using a window size of 4 (sort of arbitrarily chosen), I could break up the name "Lauryn Hill" like so (converting to lower case to aid comparison):

<div class="highlight">
<pre>lauryn hill
[laur]
 [aury]
  [uryn]
   [ryn ]
    [yn h]
     [n hi]
      [ hil]
       [hill]</pre>
</div>

To do this for the entire collection of artists, I can loop through the table until my hash window reaches the end of the longest string (using "<a href="https://dev.mysql.com/doc/refman/5.0/en/information-functions.html#function_row-count" target="_blank">row_count()</a>" to determine when that happens):

{{< highlight sql >}}
DECLARE windowSize INT;
DECLARE idx INT;
SET windowSize = 4;
SET idx = 1;

INSERT INTO hashes(artistId,hash)
SELECT
  artistId,
  artist
FROM artists
WHERE CHAR_LENGTH(artist) < (windowSize);

INSERT INTO hashes(artistId,hash)
SELECT
  artistId,
  substr(artist,idx,windowSize)
FROM artists
WHERE CHAR_LENGTH(substr(artist,idx,windowSize)) >= (windowSize);

while ROW_COUNT() > 0 do
  SET idx = idx + 1;

  INSERT INTO hashes(artistId,hash)
  SELECT
    artistId,
    substr(artist,idx,windowSize)
  FROM artists
  WHERE CHAR_LENGTH(substr(artist,idx,windowSize)) >= (windowSize);
END while;
{{< /highlight >}}

An important part of deduplication is determining how likely something is actually a dupe. I figured that the more hashes an artist matches with another artist, the more likely it was a dupe. Using this, I can order my matches by that difference so I can deal with the most likely dupes first.

{{< highlight sql >}}
INSERT INTO matches(artistId1,artistId2,matches)
SELECT
  h1.artistId,
  h2.artistId,
  COUNT(1) AS matches
FROM hashes h1
  INNER JOIN hashes h2
    ON h1.hash = h2.hash
    AND h1.artistId < h2.artistId
WHERE NOT EXISTS (
  SELECT 1 FROM falsePositives fp
  WHERE fp.artistId1 = h1.artistId  
  AND fp.artistId2 = h2.artistId
)
GROUP BY h1.artistId,h2.artistId HAVING COUNT(1) > 1;

SELECT
  m.artistId1,
  a1.artist AS artist1,
  m.artistId2,
  a2.artist AS artist2,
  matches,
  (SELECT COUNT(1) FROM hashes h WHERE h.artistId = m.artistId1) - matches +
  (SELECT COUNT(1) FROM hashes h WHERE h.artistId = m.artistId2) - matches AS diff
FROM matches m
  INNER JOIN artists a1
    ON a1.artistId = m.artistId1
  INNER JOIN artists a2
    ON a2.artistId = m.artistId2
ORDER BY diff ASC;
{{< /highlight >}}

A couple notes on performance. For an artist table size of around 1300 rows, my hashes table had around 20k rows. This will obviously vary depending on your chosen hash window size and the length of names you're comparing. Additionally, indexing your hashing table is extremely important. An index on the "hash" column was critical because you're essentially doing n^2 comparisons when you join on itself, but I also put an index on "artistId" to make the aggregate in the final query faster.

This code in MySQL stored procedures, as well as the schemas for the tables used, can be found on <a href="https://github.com/sedenardi/festival-guide/tree/master/db_models" target="_blank">GitHub</a>.
