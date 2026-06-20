# Design: Lịch sử & Gợi ý nhanh thành Bottom Sheet Tab

**Date:** 2026-06-20  
**Status:** Approved

## Tóm tắt

Chuyển "Lịch sử hội thoại" và "Gợi ý nhanh" — hiện là overlay drawer và section thu gọn trong ChatPanel — thành 2 tab riêng ở bottom TabBar. Khi bấm, chúng mở ra dưới dạng bottom sheet với dim overlay phía sau, thay vì chiếm toàn bộ vùng content.

## Kiến trúc & State

### Tab type

```ts
// src/types.ts
export type Tab = 'chat' | 'tasks' | 'noti' | 'history' | 'quick'
```

### Store changes (`useWidgetStore`)

Thêm field:
```ts
sheetTab: 'history' | 'quick' | null
```

Xóa field:
- `historyOpen` (không còn cần)
- `quickCollapsed` (không còn cần)

Xóa actions:
- `toggleHistory`
- `toggleQuick`

`switchTab` logic mới:
```ts
switchTab: (tab) => {
  if (tab === 'history' || tab === 'quick') {
    const isAlreadyOpen = get().sheetTab === tab
    set({
      sheetTab: isAlreadyOpen ? null : tab,
      activeTab: isAlreadyOpen ? 'chat' : get().activeTab,
    })
    return
  }
  set({ activeTab: tab, sheetTab: null, currentTaskId: null })
}
```

Thêm action `closeSheet`:
```ts
closeSheet: () => set({ sheetTab: null, activeTab: 'chat' })
```

## UI Components

### TabBar

Thêm 2 `TabsTrigger` mới, cùng style với 3 tab hiện tại:
- `id: 'history'`, icon: `History` (lucide), label: "Lịch sử"
- `id: 'quick'`, icon: `Zap` (lucide), label: "Gợi ý"

Không có badge cho 2 tab mới này.

### ChangWidget

Cấu trúc mới:

```
<Header />
<Tabs value={activeTab}>              ← chỉ bind với 3 tab chính
  <TabsContent value="chat">…</TabsContent>
  <TabsContent value="tasks">…</TabsContent>
  <TabsContent value="noti">…</TabsContent>

  {/* dim overlay */}
  {sheetTab && (
    <div
      onClick={closeSheet}
      className="absolute inset-0 z-10 bg-black/30 transition-opacity"
    />
  )}

  {/* bottom sheets */}
  <BottomSheet open={sheetTab === 'history'}>
    <HistorySheetContent />
  </BottomSheet>
  <BottomSheet open={sheetTab === 'quick'}>
    <QuickSheetContent />
  </BottomSheet>

  <TabBar />    ← z-30, luôn bấm được
</Tabs>
```

### BottomSheet (component mới)

- `absolute bottom-[TabBarHeight] left-0 right-0`
- `max-h-[60%]` với `overflow-y-auto`
- Bo tròn góc trên: `rounded-t-2xl`
- Drag handle ở đầu (visual only, không có drag gesture)
- Animation: `translate-y-full` → `translate-y-0` (200ms ease-out) khi `open` thay đổi
- `z-20`

### HistorySheetContent (tách từ HistoryDrawer)

Nội dung giữ nguyên từ `HistoryDrawer` (search bar, nhóm Đã ghim / Hôm nay / 7 ngày qua), bỏ:
- Header "Lịch sử hội thoại" + nút back + nút new chat (thay bằng drag handle của sheet)

Nút new chat (`SquarePen`) được giữ lại ở góc phải của drag handle row trong sheet.

### QuickSheetContent (tách từ QuickSuggestions)

Grid các Chip gợi ý nhanh, không cần nút toggle. Layout: `flex flex-wrap gap-2 p-4`.

### ChatPanel

Xóa:
- `<QuickSuggestions />` ở đầu
- `<HistoryDrawer />` ở cuối

### HistoryDrawer, QuickSuggestions

Các file cũ có thể xóa sau khi nội dung đã được tách vào `HistorySheetContent` và `QuickSheetContent`.

## Z-index Stack

| Layer | Z-index |
|---|---|
| TabBar | z-30 |
| BottomSheet | z-20 |
| Dim overlay | z-10 |
| Content panels (chat/tasks/noti) | z-0 |

## Tương tác

| Hành động | Kết quả |
|---|---|
| Bấm tab Lịch sử / Gợi ý | Sheet mở, dim overlay xuất hiện, `activeTab` giữ nguyên |
| Bấm lại tab đang mở | Sheet đóng, về tab Trò chuyện |
| Bấm dim overlay | Sheet đóng, về tab Trò chuyện |
| Bấm tab Chat / Công việc / Thông báo khi sheet mở | Sheet đóng, switch sang tab đó |

## Không thay đổi

- `TaskDetailPanel`, `TasksPanel`, `NotificationsPanel`
- Toàn bộ logic chat, task, notification trong store
- `Header`, `Composer`, `MessageList`, `Stage`, `Launcher`
