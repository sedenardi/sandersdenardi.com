---
title: NIST Password Requirements
date: 2019-06-18T19:21:00-04:00
author: Sanders
url: /nist-password-requirements/
tags:
  - passwords
  - security
---
Developing sound policies is an extremely important part of keeping your systems and users secure. Unless you yourself are a security researcher, or building some extremely specialized or novel system, you'll usually rely on industry best practices. Researching just what those best practices are can take just as much time as actually implementing them.

Thankfully, when it comes to password and authentication security, we don't have to look very far. The National Institute of Standards and Technology (NIST) publishes, among many other things, [Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html) containing recommendations on user authentication. Rather than come up with your own custom password rules, you can follow these sensible policies from a trusted authority on security.

## The Requirements

The last version of the guidelines was published in June 2017, and makes several recommendations on the constraints and validations you should perform on incoming passwords (as described in section [5.1.1.2](https://pages.nist.gov/800-63-3/sp800-63b.html#-5112-memorized-secret-verifiers)):

- require passwords be **at least 8 characters** long
- allow passwords to be at least 64 character long
- **allow ASCII and Unicode** characters, including spaces
- **perform normalization** on Unicode strings
- **check incoming passwords** against a list of commonly-used, expected, or compromised passwords, and reject if found
- **don't impose any complexity requirements** (uppercase, number, non-alphanumeric, etc.)

For password collection and transmission:

- don't allow **password hints**
- don't allow **security questions** (custom or pre-canned)
- don't **expire passwords**
- offer **meaningful feedback** when a password is rejected, optionally in the form of a password strength meter
- **limit failed authentication attempts** by fixed or variable rate-limiting, requiring a CAPTCHA, IP white list, or some other method
- allow users to **paste passwords** into login forms (facilitating the use of password managers)
- allow the user to **display the password** they've entered, either entirely or one character at a time, so they may verify their input
- only transmit passwords over an **encrypted channel**, such as SSL

And recommendations for how to store passwords include:

- store passwords salted and hashed using a suitable one-way key derivation function (such as PBKDF2)
- use a cost (work) factor suitably high given the function type (at least 10k for PBKDF2) and practical machine performance 

## Implementation Thoughts

### Unicode Normalization

Accepting Unicode as passwords is great for supporting international users. However, similar characters can come from different sources, and identical-looking characters can be different underneath. For example, consider the following code (adapted from [MDN docs on String.normalization](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)):

```js
const first = '\u212B';         // "Å"
const second = '\u0041\u030A';  // "Å"
first === second;             // false
first.normalize('NFKC') === second.normalize('NFKC'); // true
```

Normalization either combines (using NFKC) or destructs (NFKD) Unicode characters to uniform representations. This ensures the same characters are consistently compared to the stored password.

### Known-Bad Password List

Checking incoming new passwords against a list of commonly-used, expected, or compromised (known-bad) passwords means you actually have a list of said passwords somewhere on your system. You never want to send your passwords to an external service for validation, as you have no control how the password is stored or processed. Either store the list and perform validation on the application server itself, or store the list in a separate data store, such as a properly-indexed SQL table, or Redis set. I prefer a separate data store because changes to the list don't require deploying new versions, and bundling password lists increases code bundle size.

As for the password list itself, the [SecLists Common-Credentials](https://github.com/danielmiessler/SecLists/tree/master/Passwords/Common-Credentials) repository is a popular source. Maintained by the [OWASP Foundation](https://www.owasp.org/), it contains common passwords and PINs from a several of sources, in a variety of sizes. A commonly used list is `100k-most-used-passwords-NCSC.txt`, which contains the 100,000 most used passwords according to the National Computer Security Center (part of the NSA).

### Password Hashing Function

While the NIST only mentions PBKDF2 as a recommendation for a one-way key derivation function, several other functions exist that may be more suitable for your application. As noted in [blog posts](https://medium.com/@mpreziuso/password-hashing-pbkdf2-scrypt-bcrypt-and-argon2-e25aaf41598e) and [Stack Overflow](https://stackoverflow.com/questions/1561174/sha512-vs-blowfish-and-bcrypt/1561245#1561245) and [Stack Exchange](https://security.stackexchange.com/questions/4781/do-any-security-experts-recommend-bcrypt-for-password-storage/6415#6415) answers, other functions such as [bcrypt](https://en.wikipedia.org/wiki/Bcrypt), [scrypt](https://en.wikipedia.org/wiki/Scrypt), and [Argon2](https://en.wikipedia.org/wiki/Argon2) offer somewhat more security than PBKDF2 due to advancements in attacks incorporating GPU parallelization and custom FPGAs. However, it is my understanding that any function using a high enough work factor should offer suitable protection for your password storage.
