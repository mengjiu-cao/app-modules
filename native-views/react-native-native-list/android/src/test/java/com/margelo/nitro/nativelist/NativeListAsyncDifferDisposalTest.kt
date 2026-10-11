package com.margelo.nitro.nativelist

import androidx.recyclerview.widget.AsyncDifferConfig
import androidx.recyclerview.widget.AsyncListDiffer
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListUpdateCallback
import java.util.ArrayDeque
import java.util.concurrent.Executor
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

/** Verifies the AndroidX cancellation contract used by final adapter disposal. */
class NativeListAsyncDifferDisposalTest {
  @Test fun clearingBeforeBackgroundDiffRunsCannotRestoreRows() {
    val fixture = Fixture()
    fixture.differ.submitList(listOf("old"))
    var committed = false
    fixture.differ.submitList(listOf("next")) { committed = true }

    fixture.differ.submitList(null)
    assertEquals(emptyList<String>(), fixture.differ.currentList)
    fixture.background.drain()
    fixture.main.drain()

    assertEquals(emptyList<String>(), fixture.differ.currentList)
    assertFalse(committed)
    assertEquals(listOf("insert:0:1", "remove:0:1"), fixture.updates)
  }

  @Test fun clearingAfterDiffCalculationRejectsAlreadyQueuedMainCommit() {
    val fixture = Fixture()
    fixture.differ.submitList(listOf("old"))
    var committed = false
    fixture.differ.submitList(listOf("old", "next")) { committed = true }
    fixture.background.drain()
    assertEquals(1, fixture.main.size)

    fixture.differ.submitList(null)
    fixture.main.drain()

    assertEquals(emptyList<String>(), fixture.differ.currentList)
    assertFalse(committed)
    assertEquals(listOf("insert:0:1", "remove:0:1"), fixture.updates)
  }

  private class QueuedExecutor : Executor {
    private val tasks = ArrayDeque<Runnable>()
    val size: Int get() = tasks.size
    override fun execute(command: Runnable) { tasks.addLast(command) }
    fun drain() { while (tasks.isNotEmpty()) tasks.removeFirst().run() }
  }

  private class Fixture {
    val background = QueuedExecutor()
    val main = QueuedExecutor()
    val updates = ArrayList<String>()
    val differ = AsyncListDiffer(
      object : ListUpdateCallback {
        override fun onInserted(position: Int, count: Int) { updates.add("insert:$position:$count") }
        override fun onRemoved(position: Int, count: Int) { updates.add("remove:$position:$count") }
        override fun onMoved(fromPosition: Int, toPosition: Int) { updates.add("move:$fromPosition:$toPosition") }
        override fun onChanged(position: Int, count: Int, payload: Any?) { updates.add("change:$position:$count") }
      },
      AsyncDifferConfig.Builder(object : DiffUtil.ItemCallback<String>() {
        override fun areItemsTheSame(oldItem: String, newItem: String) = oldItem == newItem
        override fun areContentsTheSame(oldItem: String, newItem: String) = oldItem == newItem
      }).setBackgroundThreadExecutor(background).setMainThreadExecutor(main).build(),
    )
  }
}
