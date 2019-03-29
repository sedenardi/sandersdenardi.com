---
title: Queries in SELECT statements vs APPLY in MS SQL Server
date: 2013-05-07T12:25:28-04:00
author: Sanders
url: /queries-in-select-statements-vs-apply/
tags:
  - sql
  - sql-server
---
There are many times working with SQL when you want to select just one particular row from a table which has many that satisfy a join condition. This could be when you want the latest record, or just one name from a large set of valid names. I've personally encountered this when writing BI reports.

For this example, I'm using a table called 'Entities' and a table called 'Names', which is referenced by the column Entities.EntityID. Names has a RecordedOn DateTime field.

The approach I've seen most often is to write an inline query in the select statement:

{{< highlight sql >}}
SELECT
  e.EntityID
, (SELECT TOP 1 Name
  FROM Names n
  WHERE n.EntityID = e.EntityID
  ORDER BY RecordedOn DESC) AS Name
FROM Entities e
WHERE e.EntityID = 1234;
{{< /highlight >}}

This query will get latest name (if a name exists in the Names table) for the entity I specify. If a name for the entity does not exist, the Name column will be NULL.

An alternate (and in my experience seldom-used) way to do this is to use the MS SQL Server-specific operator <a href="http://technet.microsoft.com/en-us/library/ms175156.aspx" target="_blank">OUTER APPLY</a>. In short, APPLY runs a function (or in our example a query) for each row in the outer expression. You can think of the difference between CROSS APPLY and OUTER APPLY like the difference between INNER JOIN and LEFT OUTER JOIN, where the former runs the function for matched rows while the latter for all rows in the outer query. Rewriting the above query using the APPLY:

{{< highlight sql >}}
SELECT
  ent.*
, name.Name
FROM Entities e
  OUTER APPLY (
    SELECT TOP 1 Name
    FROM Names n
    WHERE n.EntityID = e.EntityID
    ORDER BY RecordedOn DESC) name
WHERE e.EntityID = 1234;
{{< /highlight >}}

This query returns the identical results as the first one. If we turn on <a href="http://msdn.microsoft.com/en-us/library/ms184361.aspx" target="_blank">STATISTICS IO</a> we will see that they perform the exact same number of scans and logical reads on both tables.

So the question now is which one is better to use. While I feel that using APPLY makes for cleaner code, it is not ANSI-SQL compatible since it is a MSSQL-specific operation. Further, APPLY may not be familiar to DBAs coming from other SQL implementations.
