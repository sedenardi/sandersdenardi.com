---
title: Using The Android DownloadManager
date: 2013-02-18T17:31:08-05:00
author: Sanders
url: /using-the-android-downloadmanager/
tags:
  - android
---
Since Gingerbread, Android has included support for handling long-running downloads via the <a href="http://developer.android.com/reference/android/app/DownloadManager.html" target="_blank">DownloadManager</a>. Using previous versions apps had to manually handle threading, displaying progress to the user, connectivity issues, and registering the downloaded media with the <a href="http://developer.android.com/reference/android/provider/MediaStore.html" target="_blank">MediaStore</a> (if applicable). In this example, I’m going to use the built-in DownloadManager to download an MP3 and handle its completion via a <a href="http://developer.android.com/reference/android/content/BroadcastReceiver.html" target="_blank">BroadcastReceiver</a>.

Before initiating the download, we want to query the DownloadManager to see whether the file is currently being downloaded so we prevent duplicates.

```java
DownloadManager mgr = (DownloadManager)
  context.getSystemService(Context.DOWNLOAD_SERVICE);
boolean isDownloading = false;
DownloadManager.Query query = new DownloadManager.Query();
query.setFilterByStatus(
  DownloadManager.STATUS_PAUSED|
  DownloadManager.STATUS_PENDING|
  DownloadManager.STATUS_RUNNING|
  DownloadManager.STATUS_SUCCESSFUL
);
Cursor cur = mgr.query(query);
int col = cur.getColumnIndex(
  DownloadManager.COLUMN_LOCAL_FILENAME);
for(cur.moveToFirst(); !cur.isAfterLast(); cur.moveToNext()) {
  isDownloading = isDownloading || ("local file path" == cur.getString(col));
}
cur.close();
```

I use a <a href="http://developer.android.com/reference/android/app/DownloadManager.Query.html" target="_blank">DownloadManager.Query</a> to filter the information I want to get from the DownloadManager. I only care about the downloads that are either in the queue, are running, or have been successfully finished, and check to see whether the local path where I’m going to save the file exists already exists. If it does, I will not continue with the next step, actually requesting the file for downloading. Keep in mind that querying any Android service, including the DownloadManager, is a blocking action, so you may want to consider moving this code to another thread if you're downloading large amounts of files as to not block the UI and give the appearance of unresponsiveness.

```java
if (!isDownloading) {
  Uri source = Uri.parse("remote url");
  Uri destination = Uri.fromFile(new File("local file path"));

  DownloadManager.Request request = new DownloadManager.Request(source);
  request.setTitle("file title");
  request.setDescription("file description");
  request.setDestinationUri(destination);
  request.setNotificationVisibility(
    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
  );
  request.allowScanningByMediaScanner();

  long id = mgr.enqueue(request);
}
```

To initiate a download, you must create a <a href="http://developer.android.com/reference/android/app/DownloadManager.Request.html" target="_blank">DownloadManager.Request</a> that contains the source, destination, and any optional parameters you specify. In this example, I’m setting the title and description so the notification contains something besides the filename. I’m also specifying that I want the download visible as a notification during the actual download and when it’s completed. Lastly, I specify that I want the file to be added to the MediaStore once it’s finished. Calling enqueue on the DownloadManager will add the file and start the download, returning a long that can be used to easily identify which file finished.

Just downloading the file may be enough for some, but since I want to trigger an action once it’s completed (such as open the file, or add it to an app’s database), I will need to use a BroadcastReceiver to handle the DownloadManager’s completion.

```java
public class DownloadReceiver extends BroadcastReceiver{
  @Override
  public void onReceive(Context context, Intent intent) {
    long receivedID = intent.getLongExtra(
      DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
    DownloadManager mgr = (DownloadManager)
      context.getSystemService(Context.DOWNLOAD_SERVICE);

    DownloadManager.Query query = new DownloadManager.Query();
    query.setFilterById(receivedID);
    Cursor cur = mgr.query(query);
    int index = cur.getColumnIndex(DownloadManager.COLUMN_STATUS);
    if(cur.moveToFirst()) {
      if(cur.getInt(index) == DownloadManager.STATUS_SUCCESSFUL){
        // do something
      }
    }
    cur.close();
  }
}
```

Once this class is registered to receive the broadcast intent "android.intent.action.DOWNLOAD_COMPLETE" (either programmatically or in our AndroidManifest.xml file), the onReceive() method will execute whenever a download is finished. The intent has the download ID as an extra, so I use that to again query the DownloadManager and check to see whether it completed successfully (a failure will trigger this intent as well, so this step is important). Since I stored the download ID when I queued it (returned from enqueue()), I can use it to easily figure out which file finished downloading. However, you can use the other columns in the DownloadManager to get the file’s title or filename.
