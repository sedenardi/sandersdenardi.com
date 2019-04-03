---
title: Moving Files in Android
date: 2013-10-10T13:49:20-04:00
author: Sanders
url: /moving-files-in-android/
tags:
  - android
---
Android users have the luxury of being able to access the storage on their devices. Because of this, many prefer to maintain their own directory structure and organization pattern for their files. A frequently requested feature for <a title="Vibe Vault" href="https://play.google.com/store/apps/details?id=com.code.vibevault" target="_blank">Vibe Vault</a> is the ability to change the directory to which we download files. Many apps unfortunately don't allow users to change where files are stored, and I suspect it's either because developers hard-code path variables, or they don't want to risk moving around existing files and directories. When it comes to moving files, there are two ways to do so: copying and deleting, or simply renaming.

The copying/deleting method is fairly straightforward to implement, as recursive file copy methods are fairly intuitive.

```java
public static boolean directoryCopy(File oldPath, File newPath) {
  boolean result = true;
  try {
    if (!newPath.exists()) {
      newPath.mkdir();
    }
    for (File f : oldPath.listFiles()) {
      if (f.isDirectory()) {
        File newDir = new File(newPath, f.getName());
        result = directoryCopy(f, newDir);
      } else {
        File newFile = new File(newPath, f.getName());
        InputStream in = new FileInputStream(f);
        OutputStream out = new FileOutputStream(newFile);
        byte[] buf = new byte[1024];
        int len;
        while ((len = in.read(buf)) > 0) {
          out.write(buf, 0, len);
        }
        in.close();
        out.close();
      }
    }
  } catch (IOException e) {
    result = false;
  }
  return result;
}
```

This method guarantees the integrity of the source files throughout the operation because it's only performing read operations on them. After you actually perform the copy, you then delete the source folder to complete the move operation.

```java
public static boolean deleteFileOrDirectory(File path) {
  boolean success = true;
  if (path.isDirectory()) {
    for (File f : path.listFiles()) {
      success = success && deleteFileOrDirectory(f);
    }
  }
  return success && path.delete();
}
```

One caveat to consider is whether you have enough space on your storage volume to handle the copy. To check this, you must get the size of the directory you're copying

```java
public static long getFolderSize(File dir) {
  long size = 0;
  for (File f : dir.listFiles()) {
    if (f.isFile()) {
      size += f.length();
    } else {
      size += getFolderSize(f);
    }				
  }
  return size;
}
```

the free space available on the storage volume (in this case the SD card)

```java
public static double getFreeSpaceAvailable() {
  StatFs stat = new StatFs(Environment.getExternalStorageDirectory().getPath());
  return (double)stat.getAvailableBlocks() * (double)stat.getBlockSize();
}
```

and validate them (you can simply cast the folder size to a double to compare them since both functions return bytes).

This method of checking space, copying files, and deleting has some big drawbacks. The first and most obvious is that you must have the adequate space available to perform the copy. A close second is the fact that file copies take a significant amount of time. On the desktop NAND flash copies may seem extremely fast, but any operation on a mobile device that takes more than a couple seconds feels like an eternity.

The second method mentioned at the beginning of the post addresses these concerns. Renaming the files and directories instead of copying/deleting them should be a nearly-instantaneous operation, and alleviate any space requirement concerns. We can use Android's <a href="http://developer.android.com/reference/java/io/File.html#renameTo(java.io.File)" target="_blank">renameTo()</a> method to simply change the file's or directory's path. In fact, the recursive method looks a lot like our directoryCopy() method.

```java
public static boolean directoryMove(File oldRootDir, File newRootDir) {
  boolean result = true;
  if (!newRootDir.exists()) {
    result = result && newRootDir.mkdirs();
  }
  if (result) {
    for (File f : oldRootDir.listFiles()) {
      if (f.isDirectory()) {
        File newDir = new File(newRootDir, f.getName());
        result = result && directoryMove(f, newDir);
      } else {
        File newFile = new File(newRootDir, f.getName());
        if (newFile.exists()) {
          result = result && newFile.delete();
        }
        result = result && f.renameTo(newFile);
      }
    }
  }
  return result;
}
```

Java's renameTo() is inherently <a href="http://docs.oracle.com/javase/7/docs/api/java/io/File.html#renameTo(java.io.File)" target="_blank">platform-dependent</a>, meaning it will fail for different reasons on different systems, and won't give a specific reason (won't throw an exception, will just return false). Looking at Android's API, we can see the most common types of failures and mitigate each one:

  1. Write permission is required on the directories containing both the source and destination paths.
  2. Search permission is required for all parents of both paths.
  3. Both paths be on the same mount point. On Android, applications are most likely to hit this restriction when attempting to copy between internal storage and an SD card.

These points are addressed by the fact that a) we require the <a href="http://developer.android.com/reference/android/Manifest.permission.html#READ_EXTERNAL_STORAGE" target="_blank">READ_EXTERNAL_STORAGE</a> and <a href="http://developer.android.com/reference/android/Manifest.permission.html#WRITE_EXTERNAL_STORAGE" target="_blank">WRITE_EXTERNAL_STORAGE</a> to ensure we have the correct permissions, and b) we restrict the moving function to folders relative to the root of the SD card. Other, more platform-agnostic issues that may prevent a successful copy are:

  1. Specifying a new path whose parent directories do not exist (solved by using <a style="font-style: normal;" href="http://developer.android.com/reference/java/io/File.html#mkdirs()" target="_blank">mkdirs()</a> to create any missing parent directories)
  2. Target directory exists already (solved by creating the directory structure and only renaming actual files)
  3. Target files exist already ("solved" by deleting the existing target file and performing the rename)

Using these techniques we can confidently perform move operations of a large number of files relatively quickly. You'll notice that in both of these methods, copy/delete and rename, we're preserving the return status of each file operation and returning it to the user. This is essential to a) give the user feedback on the success of the operation and b) to determine whether any other path changing operations need to be performed. Because of issue #2 above, we need to cleanup the source directories because we aren't renaming the directories, just the files. We can reuse our deleteFileOrDirectory() method to cleanup the old directory tree

Another post-move operation we may need to perform is changing file paths in Android's ContentProviders. For instance, if we're copying media files, we'll want to change the path in the MediaStore. Using the technique I outlined in a <a title="Moving a File In The Android MediaStore" href="/moving-a-file-in-the-android-mediastore/">previous article</a>, we can create a recursive method to change all paths:

```java
public static void changePathInMediaStore(Context context,
  File newRootDir, String oldPath, String newPath) {
  for (File f : newRootDir.listFiles()) {
    if (f.isDirectory()) {
      changePathInMediaStore(context, f, oldPath, newPath);
    } else {
      String oldFilePath = f.getAbsolutePath().replace(newPath, oldPath);
      ContentValues values = new ContentValues();
      values.put(MediaStore.MediaColumns.DATA, f.getAbsolutePath());
      int rows = context.getContentResolver().update(
        MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, values,
        MediaStore.MediaColumns.DATA + "='" + oldFilePath + "'", null
      );
    }
  }
}
```

Two final notes on these two ways to move files. If you're moving media files while playing them, your MediaPlayer instance should be unaffected if it has buffered the entire file already. While I haven't explicitly tested this, I suspect the renameTo() operation will fail if a MediaPlayer instance has an open handle on the file. Additionally, if you are downloading files while using Android's <a title="Using The Android DownloadManager" href="/using-the-android-downloadmanager/">DownloadManager</a>, any queued downloads will fail once they start after the rename operation because the destination path no longer exists, and they won't be restartable (you'll have to re-queue the download using the new path). For the copy/delete method, one can add code in the delete method to check to see whether the file is in use (in the case of the MediaPlayer) or is new and uncopied (in the case of a recent download) and act accordingly. For the rename method, one can delay the rename if the file is in use (in the case of the MediaPlayer) or check to see whether the destination path is still valid and update it if it is not (in the case of downloads).
