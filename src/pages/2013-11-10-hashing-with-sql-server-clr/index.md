---
title: Hashing With SQL Server CLR
date: 2013-11-10T14:19:30-05:00
author: Sanders
url: /hashing-with-sql-server-clr/
tags:
  - sql
  - sql-server
---
I have been looking at using hashes in a computed column to determine equality among rows, rather than compare each column. While running some tests, I encountered a limitation with SQL Server's [HASHBYTES](http://technet.microsoft.com/en-us/library/ms174415.aspx) function: the input can only be 8000 bytes or smaller. This won't work for our purposes, as some of our tables have NVARCHAR(MAX) columns whose maximum length exceeds 8000 bytes. One solution I'm looking into is using a [CLR](http://technet.microsoft.com/en-us/library/ms131102.aspx). **UPDATE**: I've added remarks and benchmarks for the undocumented function "fn\_repl\_hash_binary".

Looking at C#'s built-in hashing capabilities (supported through [System.Security.Cryptography](http://msdn.microsoft.com/en-us/library/system.security.cryptography%28v=vs.110%29.aspx)), I see the algorithms supported by both HASHBYTES and C# are MD5, SHA1, SHA256, and SHA512. Since I have no preference over which hashing algorithm to use (the probability of collision is low enough for each, and I am not concerned with security), I'm going to benchmark each and pick the fastest one. Instead of writing a separate function for each algorithm, I can use a simple switch statement to pick between them.

```csharp
[SqlFunction(IsDeterministic = true)]
public static SqlBinary GetHash(SqlString algorithm, SqlBytes src)
{
  if (src.IsNull)
    return null;

  switch (algorithm.Value.ToUpperInvariant())
  {
    case "MD5":
      return new SqlBinary(MD5.Create().ComputeHash(src.Stream));
    case "SHA1":
      return new SqlBinary(SHA1.Create().ComputeHash(src.Stream));
    case "SHA2_256":
      return new SqlBinary(SHA256.Create().ComputeHash(src.Stream));
    case "SHA2_512":
      return new SqlBinary(SHA512.Create().ComputeHash(src.Stream));
    default:
      throw new ArgumentException("HashType",
        "Unrecognized hashtype: " + algorithm.Value);
  }
}
```

This function matches the syntax of SQL Server's HASHBYTES, in that the first parameter is a string name of the algorithm, and the second is the value to be hashed. The key difference between the two is the type of the second parameter. HASHBYTES takes in a VARCHAR, NVARCHAR, or VARBINARY. One important thing to note is that a particular string stored as a VARCHAR will have a different hash than if the string were stored as a NVARCHAR. You can verify this by simply running the following:

```sql
SELECT HASHBYTES('MD5',CONVERT(VARCHAR(8000),'test'))
--0x098F6BCD4621D373CADE4E832627B4F6
SELECT HASHBYTES('MD5',CONVERT(NVARCHAR(4000),'test'))
--0xC8059E2EC7419F590E79D7F1B774BFE6
```

As your can see, the two have distinctly different hashes. The binary representations of both types also hash to the same value of their respective type:

```sql
SELECT HASHBYTES('MD5',CONVERT(VARBINARY(8000),'test'))
--0x098F6BCD4621D373CADE4E832627B4F6
SELECT HASHBYTES('MD5',CONVERT(VARBINARY(8000),N'test'))
--0xC8059E2EC7419F590E79D7F1B774BFE6
```

To verify that our function behaves the same (our implementation should not behave any differently than the built in function), we can run the following:

```sql
SELECT dbo.GetHash('MD5',CONVERT(VARBINARY(8000),'test'))
--0x098F6BCD4621D373CADE4E832627B4F6
SELECT dbo.GetHash('MD5',CONVERT(VARBINARY(8000),N'test'))
--0xC8059E2EC7419F590E79D7F1B774BFE6
```

To verify our function accomplishes what we created it for in the first place, we need to come up with an input that exceeds HASHBYTES's 8000 byte limit. I'll create an input of 10,000 bytes by using SQL Server's [REPLICATE](http://technet.microsoft.com/en-us/library/ms174383.aspx) function. I'll pick a simple string, "test1", and replicate it 2000 times to create an input of 10,000 bytes.

```sql
DECLARE @INPUT VARCHAR(MAX);
SELECT @INPUT = REPLICATE(CAST('test1' AS VARCHAR(MAX)),2000);
SELECT HASHBYTES('MD5',@INPUT);
--Error: String or binary data would be truncated.
SELECT dbo.GetHash('MD5',CONVERT(VARBINARY(MAX),@INPUT));
--0xB08D483188CC4526FBE981349B3C1744
```

The REPLICATE function requires we cast our test string as a VARCHAR(MAX) in order for it to output beyond 8000 bytes. It's a bit annoying how these 8000 bytes limitations keep popping up.

Now that we know our function works, we can go about testing its performance. We can't test HASHBYTES and our CLR function with inputs over 8000 bytes, so to benchmark between the two we'll create a table with test values that vary uniformly in length. Since I'm a fan of using random values rather than a static "test1&#8243; string, I'm going to use SQL Server's [NEWID](http://technet.microsoft.com/en-us/library/ms190348.aspx) function to generate a 36 character long string and replicate it to the desired length. The code for doing this can be found in [my GitHub repository](https://github.com/sedenardi/sql-hashing-clr) so I won't go into detail about it here, but essentially I create a table with 90000 randomly generated values of different lengths and using 2 WHILE loops run each function over the values several times. To measure the performance, I record the CPU usage from [sys.dm_exec_requests](http://technet.microsoft.com/en-us/library/ms177648.aspx) before and after I run the function.

| ALGORITHM    | CPUAVERAGE | CPUMEDIAN | CPUSTD_DEV |
| ------------ | ---------- | --------- | ---------- |
| SQL_MD5      | 1729       | 1576      | 488        |
| SQL_SHA1     | 1783       | 1638      | 369        |
| SQL_SHA2_512 | 2912       | 2808      | 618        |
| SQL_SHA2_256 | 4100       | 3728      | 1235       |
| CLR_SHA1     | 6490       | 5850      | 2127       |
| CLR_MD5      | 6812       | 5694      | 2377       |
| CLR_SHA2_512 | 7610       | 6786      | 2583       |
| CLR_SHA2_256 | 10102      | 8627      | 3548       |

As you can see, there's a pretty big performance drop moving from HASHBYTES to a CLR function. I suspect this is due to converting the table row into a [SqlByte](http://msdn.microsoft.com/en-us/library/system.data.sqltypes.sqlbytes(v=vs.110).aspx) stream for the CLR. This performance impact is unfortunate, but something we'll have to deal with if we're using columns larger than 8000 bytes.

One optimization we can do is to use the CLR only when needed. Suppose we create a new function that checks the length of the input and decides whether to use HASHBYTES or the CLR.

```sql
CREATE FUNCTION dbo.GetHashHybrid(@algorithm NVARCHAR(4000)
  ,@INPUT VARBINARY(MAX))
RETURNS VARBINARY(8000) WITH SCHEMABINDING
AS
BEGIN
RETURN (
  SELECT CASE
    WHEN DATALENGTH(@INPUT) > 8000
      THEN dbo.GetHash(@algorithm,@INPUT)
    ELSE
      HASHBYTES(@algorithm,@INPUT)
    END
)
END
```

This new function is a drop-in replacement of our GetHash function, taking the same parameters and types. Running the same sub-8000 benchmark including the hybrid and the built-in fn\_repl\_hash_binary functions:

| ALGORITHM       | CPUAVERAGE | CPUMEDIAN | CPUSTD_DEV |
| --------------- | ---------- | --------- | ---------- |
| SQL_MD5         | 2131       | 1885      | 676        |
| SQL_SHA1        | 2296       | 2217      | 691        |
| SQL_SHA2_512    | 3910       | 3819      | 1140       |
| Hybrid_MD5      | 4237       | 4225      | 680        |
| Hybrid_SHA1     | 4366       | 4086      | 1230       |
| Hybrid_SHA2_512 | 5448       | 5202      | 1189       |
| SQL_SHA2_256    | 5489       | 4948      | 1731       |
| Repl_MD5        | 5828       | 5498      | 952        |
| CLR_MD5         | 6068       | 5754      | 1076       |
| CLR_SHA1        | 6636       | 6371      | 1438       |
| Hybrid_SHA2_256 | 6937       | 6384      | 1616       |
| CLR_SHA2_512    | 7061       | 6865      | 1172       |
| CLR_SHA2_256    | 9533       | 8881      | 1773       |

We see a pretty significant performance boost over the CLR function. Even though our hybrid function isn't ever running the CLR, performance is still worse than using just HASHBYTES because of the extra time needed to check the length of the input. We can also notice that fn\_repl\_hash_binary is more than twice as slow as the HASHBYTES.

To test cases for which we created the function in the first place, we'll run the same test as before and make our test values half under 8000 bytes long and half over, so we can guarantee HASHBYTES is being hit as well. This benchmarking script is contained in the same GitHub repository as the previous one.

| ALGORITHM       | CPUAVERAGE | CPUMEDIAN | CPUSTD_DEV |
| --------------- | ---------- | --------- | ---------- |
| CLR_SHA1        | 10740      | 9809      | 1974       |
| CLR_MD5         | 11209      | 10353     | 2413       |
| Repl_MD5        | 11503      | 11626     | 2415       |
| Hybrid_MD5      | 11981      | 11898     | 2085       |
| Hybrid_SHA1     | 12904      | 12131     | 3144       |
| CLR_SHA2_512    | 15503      | 15103     | 3075       |
| Hybrid_SHA2_512 | 17055      | 15284     | 4352       |
| CLR_SHA2_256    | 20631      | 19254     | 4395       |
| Hybrid_SHA2_256 | 22515      | 20616     | 5241       |

It turns out the case statement in the function which checks the length of the input causes a performance drop of 3-12%, depending on the algorithm. This is not insignificant, especially if you're using the function over a large number of rows, or using it in a computed column. The performance hit may not be worth it depending on the characteristics of your dataset.

It's clear that MD5 is the fastest of all the algorithms, regardless of its implementation. Since I'm more concerned with speed than collision probability, I wanted to know how much a performance gain, if any, I would see if I remove the algorithm switch statement from the CLR. Running the same benchmark with inputs over 8000 bytes I did not see a significant difference, so I would not remove the option to use multiple hashing algorithms.

As with most things in SQL Server, hashing is a prime example of knowing your dataset and the limitations of the built in functions. It's clear that if your data is under the 8000 byte limit then not only is HASHBYTES safe to use but is much faster than any of our solutions. If you have a wide distribution in your data size, then the hybrid function here gives pretty respectable performance while being able to handle data of any size. But if your data is primarily over 8000 bytes (or even distributed around it), then it may not make sense to use the hybrid function.

**EDIT**: Since Server 2008 there has been an undocumented (poorly documented?) function called "fn\_repl\_hash_binary" that performs an MD5 hash on VARBINARY(MAX) data types. I've updated the tables above to include the performance of this function. While this seems to alleviate the need for a CLR for MD5 hashes of data over 8000 bytes, its performance is noticeably worse than our hybrid function for under-8000 byte and about the same for over-8000 byte inputs. It's also worth noting that relying on an undocumented function is rarely a good idea in a production environment, as its function is subject to change or even removal without notice to the user.

**EDIT 2**: "fn\_repl\_hash_binary" is not declared as being deterministic, which further limits its usefulness compared to the other hashing functions.

**EDIT 3**: After several years, I realized that my CLR benchmarks have a significant flaw. I should be using a SqlBinary parameter instead of a SqlBytes parameter so the incoming data isn't buffered into a stream, reducing performance. I welcome pull requests to fix this issue.

View this post's code on [GitHub](https://github.com/sedenardi/sql-hashing-clr).
