---
title: Moving a File In The Android MediaStore
date: 2013-09-25T17:54:10-04:00
author: Sanders
url: /moving-a-file-in-the-android-mediastore/
tags:
  - android
---
When you move or copy a media file in Android, any app that access it via the [MediaStore](http://developer.android.com/reference/android/provider/MediaStore.html) will not automatically be updated. In one of my [previous articles](/querying-and-removing-media-from-android-mediastore/) I talked about querying and manipulating Android's MediaStore, and the cost of doing a full scan of the file system to check for changes. Luckily, there's an easier way to update the file's location: use ContentResolver's [update()](http://developer.android.com/reference/android/content/ContentResolver.html#update%28android.net.Uri,%20android.content.ContentValues,%20java.lang.String,%20java.lang.String[]%29) method.

```java
ContentValues values = new ContentValues();
values.put(MediaStore.MediaColumns.DATA, newPath);
int rows = context.getContentResolver().update(
  MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, values,
  MediaStore.MediaColumns.DATA + "='" + oldPath + "'", null
);
```

In this example I'm moving an audio file. Because the path to the actual file is stored in the MediaStore.MediaColumns.DATA column, I want to query on it and change it. The update() method uses [ContentValues](http://developer.android.com/reference/android/content/ContentValues.html) to make changes to the MediaStore, and since I only want to update the DATA column, I put the new file path with the appropriate key. Here I'm just concatenating string to build my selection parameter, so the last parameter is left null. The function returns an integer of the rows that were affected, and can be used to verify that you're querying and updating the correct row.

As pointed out by a commenter in a previous post, update(), as well as any other function on a ContentResolver, is synchronous. This means that if called on the UI thread it will block until it completes. While, in my experience, updating one row is extremely fast, you should put all potentially costly method calls, especially ones that do not directly affect the UI, in a separate thread.
