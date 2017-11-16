---
title: Querying And Removing Media From The Android MediaStore
date: 2013-01-19T17:49:06+00:00
author: Sanders
url: /querying-and-removing-media-from-android-mediastore/
tags:
  - android
---
Android provides a way to register different type of media, such as audio, video, and images, for consumption by any app. This is convenient if your app is, say, a music player or an image editor. Android's <a href="http://developer.android.com/reference/android/provider/MediaStore.html" target="_blank">MediaStore</a> is the provider for this meta data, and includes information about the media such as title, artist, size, and location.

If your application does any sort of media content creation, such as image editing or downloading audio from an external website, then you generally want to make that content accessible from any other apps that can consume it. When you create a file you can use the <a href="http://developer.android.com/reference/android/media/MediaScannerConnection.html" target="_blank">MediaScannerConnection</a> to add the file and its metadata to the MediaStore.

If you delete the file from the file system, the metadata remains in the MediaStore until Android scans the system for new media, which typically happens when the system first boots up or can be called explicitly called in such a way:

{{< highlight java >}}
sendBroadcast(
  new Intent(
    Intent.ACTION_MEDIA_MOUNTED,
    Uri.parse("file://" + Environment.getExternalStorageDirectory())
  )
);
{{< /highlight >}}

While this method works, it is time and resource consuming, as basically the entire file system must be re-scanned. An alternative is to explicitly delete the file from the MediaStore. We're going to discuss two ways to do this. The first is to query to MediaStore for the content, based on some predicate, and delete based on the unique ID the MediaStore identifies it by. The second, and easier, way to do it is to just specify the predicate in the delete statement. In these example I'm going to be deleting an audio file based on it's file name and path, but you can easily use this to delete any type of media based on any known information (such as video duration, or image dimensions).

In querying the MediaStore, you should think of it as a SQL database. You need to form your query by specifying the table (the MediaStore's external content table), the columns you need (the content's ID), and the where clause (how to identify the content). To perform the actual query, we're going to use the <a href="http://developer.android.com/reference/android/content/ContentResolver.html" target="_blank">ContentResolver</a>'s query() method.

{{< highlight java >}}
String[] retCol = { MediaStore.Audio.Media._ID };
Cursor cur = context.getContentResolver().query(
  MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
  retCol,
  MediaStore.MediaColumns.DATA + "='" + filePath + "'", null, null
);
if (cur.getCount() == 0) {
    return;
}
cur.moveToFirst();
int id = cur.getInt(cur.getColumnIndex(MediaStore.MediaColumns._ID));
cur.close();
{{< /highlight >}}

The first argument to query() specifies the columns we want returned, which in this case is only "_ID". The second argument specifies that we want to look at the media stored on the external SD card (which would be internal storage on deices with no SD card). The third argument is the predicate which specifies what content we're looking for. In this case, I'm identifying the file by it's path in the file system (which is what is stored in the MediaColumns.DATA column). The fourth and fifth columns are the predicate's arguments and the ordering, respectively. I'm including my predicate's arguments in the predicate itself so that's not necessary, and if your only looking for one piece of content and your predicate is specific enough to just return one row then the ordering doesn't matter.

It is very important to make the predicate specific enough so that you're guaranteed to get the exact ID you're looking for. In my case I know that there can be only one file at a particular location, but you could use a combination of any columns (such as title, artist, and album) to find the content. Check out the <a href="http://developer.android.com/reference/android/provider/MediaStore.MediaColumns.html" target="_blank">MediaColumns</a> for all the possibilities.

Once you perform the actual query, you'll want to check to see whether the MediaStore actually contains the content you're trying to delete. If you don't handle this in some way your app will crash while trying to iterate through the cursor. Once you confirm that the query returned some data, grab the ID by moving the cursor to it's first position, reading the "_ID" column, and closing the cursor. It's very important that you remember to close the cursor once you've finished using it. Your app won't crash, but you'll get memory leaks and complaints in LogCat.

Now that we have the ID that the MediaStore associates with our content, we can call ContentResolver's delete() method similar to how we called its query() method.

{{< highlight java >}}
Uri uri = ContentUris.withAppendedId(
  MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id
);
context.getContentResolver().delete(uri, null, null);
{{< /highlight >}}

The delete() method takes 3 arguments: the Uri to be deleted, the predicate, and the predicate arguments. We form the Uri by appending the ID we discovered by querying the MediaStore to the Uri of the audio files on external storage. Since we know exactly which row we want to delete, we don't need to specify the predicate or the predicate's arguments.

The second method to delete the content from the MediaStore takes advantage of the fact that querying and deleting from it are performed almost identically.

{{< highlight java >}}
context.getContentResolver().delete(
  MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
  MediaStore.MediaColumns.DATA + "='" + path + "'", null
);
{{< /highlight >}}

We can use the predicate of the delete() method to specify exactly what we want to delete, rather than having to query for it beforehand. While this method is more efficient (no extra query, no cursors to deal with), it has some pitfalls. You have no way of explicitly confirming what you're deleting. You're also not able to do advanced queries with this method, such as if you wanted to delete the most recently added content (which you could do by ordering the query based on the DATE_ADDED column). However, both ways give you a way to confirm what you've deleted since the delete() method returns the number of rows that it deleted as an integer.
