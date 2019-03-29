---
title: Pagination Syntax in SQL Server 2012
date: 2013-09-13T13:30:08-04:00
author: Sanders
url: /pagination-syntax-in-sql-server-2012/
tags:
  - sql
  - sql-server
---
When we started upgrading our SQL Server 2008 instances to 2012, I went back and reviewed the <a href="http://technet.microsoft.com/en-us/library/09f0096e-ab95-4be0-8c01-f98753255747" target="_blank">new development features</a> that were added. There were many that I was excited to try out and find what performance and readability improvements I would experience. Among those was the pagination enhancements to the <a href="http://technet.microsoft.com/en-us/library/ms188385" target="_blank">ORDER BY</a> clause which allow you to specify an offset and number of rows you want. MySQL developers have long used the convenient <a href="http://dev.mysql.com/doc/refman/5.0/en/select.html" target="_blank">LIMIT</a> statement, but SQL Server developers have had to use subqueries or CTEs with ranking functions to achieve the same effect.

Before I start using the new syntax in my queries, I wanted to investigate the performance differences between the two methods. Not only to justify switching over to the new way of doing things, but to see what's happening under the hood.

Consider a table with the following schema and indexes:

{{< highlight sql >}}
CREATE TABLE Sources
(
  SourceID BIGINT NOT NULL,
  ElementTypeID tinyint NOT NULL,
  ElementID BIGINT NOT NULL,
  SourceTypeID tinyint NOT NULL,
  SourceDetailID BIGINT NOT NULL
  CONSTRAINT PK_Sources PRIMARY KEY NONCLUSTERED (SourceID)
);
CREATE CLUSTERED INDEX IX_Sources_SourceTypeId_SourceDetailId
  ON Sources(SourceTypeID, SourceDetailID);
CREATE NONCLUSTERED INDEX IX_Sources_ElementTypeId_ElementId
  ON Sources(ElementTypeID, ElementID);
{{< /highlight >}}

Because there can be thousands of rows for a given SourceTypeID and SourceDetailID, I'd like to perform some pagination before returning the rows to my app. The usual way I do this is, in a subquery, perform a <a href="http://technet.microsoft.com/en-us/library/ms186734.aspx" target="_blank">ROW_NUMBER()</a> over the columns by which I want to sort. I then use the page number and the number of rows I want to calculate which rows I want (my implementation returns @numResults + 1 so I can figure out if another page of data exists):

{{< highlight sql >}}
DECLARE @detailID BIGINT, @page INT, @numResults INT,
  @pageStart INT, @pageEnd INT;
SELECT @detailID = 7665626, @page = 20, @numResults = 50;

SELECT @pageStart = ( (@page - 1) * @numResults) + 1;
SELECT @pageEnd = @pageStart + @numResults;

SELECT SourceID FROM (
  SELECT SourceID,
    ROW_NUMBER() OVER(ORDER BY ElementTypeID) AS ROW
  FROM Sources s1
  WHERE s1.SourceTypeID = 6
  AND s1.SourceDetailID = @detailID
) x
WHERE x.ROW BETWEEN @pageStart AND @pageEnd;
{{< /highlight >}}

![](./qp1-pagination.png)

The query plan shows the index usage and Key Lookup required to get the data, as well as the logical operations needed to get the desired rows. The <a href="http://technet.microsoft.com/en-us/library/ms180774(v=sql.105).aspx" target="_blank">Segment</a> and <a href="http://technet.microsoft.com/en-us/library/ms187041(v=sql.105).aspx" target="_blank">Sequence Project</a> operations work to compute the ranking function ROW_NUMBER() over the specified columns. <a href="http://technet.microsoft.com/en-us/library/ms177432(v=sql.105).aspx" target="_blank">Top</a> is used here to make sure my range is not negative (it checks @pageStart and @pageEnd for negative values). Finally, <a href="http://technet.microsoft.com/en-us/library/ms175020(v=sql.105).aspx" target="_blank">Filter</a> does the actual filtering of the "row" column generated by the ROW_NUMBER() function.

Here's the same query, written with he new syntax, returning the exact same rows in the exact same order:

{{< highlight sql >}}
SELECT SourceID
FROM Sources s1
WHERE s1.SourceTypeID = 6
AND s1.SourceDetailID = @detailID
ORDER BY ElementTypeID
  OFFSET (@pageStart - 1) ROWS
  FETCH NEXT (@numResults + 1) ROWS ONLY;
{{< /highlight >}}

![](./qp2-pagination.png)

While the operations to the right of the Nested Loops are identical (which makes sense, since they both are filtering and ordering based on the same columns), the second query does only the Top operation to limit the number of rows returned. Running these two queries with <a href="http://msdn.microsoft.com/en-us/library/ms184361.aspx" target="_blank">STATISTICS IO</a> on, the scan count and logical reads are identical. Increasing @numResults by orders of magnitude also returns identical statistics.

So while the two methods use the same amount of IO resources, they do in fact use different amounts of CPU time. Using <a href="http://technet.microsoft.com/en-us/library/ms190287.aspx" target="_blank">STATISTICS TIME</a> I wasn't able to measure any significant difference in the CPU time used by either. While I'm sure there is a difference, the cost of doing the underlying query based on my where clause and the columns I'm outputting outweighs any meaningful performance difference between the two queries. Because of this, I am in no rush to go back and cut over my old queries to this new syntax.

A final word: This should only be seen as a discussion on the different syntax of pagination techniques. Queries can greatly benefit from being rewritten to avoid unnecessary Key Lookups. Dave Ballantyne has a <a href="http://sqlblogcasts.com/blogs/sqlandthelike/archive/2012/04/26/offset-without-offset.aspx" target="_blank">great article</a> on using subqueries and CTEs to minimize Key Lookups while doing pagination.