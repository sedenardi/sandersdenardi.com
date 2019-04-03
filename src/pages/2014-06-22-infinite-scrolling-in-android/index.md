---
title: Infinite Scrolling in Android
date: 2014-06-22T18:17:46-04:00
author: Sanders
url: /infinite-scrolling-in-android/
tags:
  - android
---
Infinite scrolling has become <a href="http://xkcd.com/1309/" target="_blank">very popular</a> in recent years. It's become especially popular on mobile devices for the simple fact that it allows you to fetch new data while accessing data that's already been fetched. The concept is pretty simple - once the end of the list is detected to be near, a call is made to fetch more data which is then appended to the end of the list. This post goes through my implementation, contained <a href="https://github.com/sedenardi/InfiniteScrollListView" target="_blank">here</a>.

Android has facilitated the implementation of infinite scrolling of ListViews for a long time (since at least 2.2). Infinite scrolling consists of 3 parts: the scroll listener that detects the end of the list to trigger the next load, the Adapter that displays an indicator that loading is in progress, and the ListView that manages adding new items to the list.

## InfiniteScrollOnScrollListener - Detecting the end

ListViews allow you to monitor when a scroll happens and the state of the ListView by attaching an <a href="http://developer.android.com/reference/android/widget/AbsListView.OnScrollListener.html" target="_blank">OnScrollListener</a>. The relevant method is <a href="http://developer.android.com/reference/android/widget/AbsListView.OnScrollListener.html#onScroll(android.widget.AbsListView, int, int, int)" target="_blank">onScroll()</a>, which fires every time the ListView moves and passes in the position of the ListView for each call. In this method, if we determine that the end is near (by figuring out how many items are below the view port), then we call the callback method endIsNear() (which performs any loading).

```java
public void onScroll(AbsListView view, int firstVisibleItem,
  int visibleItemCount, int totalItemCount) {
  if (totalItemCount - (firstVisibleItem + 1 + visibleItemCount) < SCROLL_OFFSET &&
    visibleItemCount < totalItemCount) {
    listener.endIsNear();
  }
}
```

Here, SCROLL_OFFSET is the number of items in the list below the view port. I usually have this set to 2.

## InfiniteScrollAdapter - Supplying the data to the ListView

ListViews use Adapters as a bridge between themselves and the underlying data. Adapters usually serve up a similar view for every item in the underlying data structure, but we will want to show some indication to the user that more data is loading in the background. In our abstract class we override BaseAdapter's getView() to return either a real view or a special loading view.

```java
public View getView(int position, View convertView, ViewGroup parent) {
  if (!doneLoading && position >= getItems().size()) {
    return getLoadingView(inflater, parent);
  } else {
    return getRealView(inflater, position, convertView, parent);
  }
}
```

If the requested position is the last one in the list, and we haven't finished loading all the data available, then we serve up a fixed loading view. Otherwise we pass along the parameters to get a real view. Both methods are abstract to be implemented by the user.

## InfiniteScrollListView - Managing appending items to the ListView

Normally, when you want to add items to a ListView you add them to the Adapter's underlying data structure and call <a href="http://developer.android.com/reference/android/widget/BaseAdapter.html#notifyDataSetChanged()" target="_blank">notifyDataSetChanged()</a>. The main difference here is that we need to determine whether there is no more data available, and if so, disable the InfiniteScrollOnScrollListener and tell the Adapter that loading is finished. This will prevent further calls to the endIsNear() method and prevent the adapter from displaying the loading view.

The appendItems() method not only handles determining when the loading is done, it also checks to see whether the list is scrollable in the first place, and if not calls the endIsNear() method manually. This is necessary because the amount of data loaded may not be enough to extend the ListView beyond the view port. If it doesn't, the ListView is unable to scroll, and the InfiniteScrollOnScrollListener's onScroll() is never called, meaning we'll never be able to load more data.

For more information on actual usage of the InfiniteScrollListView, as well as a working example, check out the <a href="https://github.com/sedenardi/InfiniteScrollListView" target="_blank">GitHub page</a>. I intentionally decided against making this a library to encourage forks of it to use with another type of ListView (such as the excellent <a href="https://github.com/emilsjolander/StickyListHeaders" target="_blank">StickyListHeaders</a>) and to make improvements.
