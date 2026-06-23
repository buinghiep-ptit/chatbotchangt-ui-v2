# Project rules

Dự án: Vite + React 19 + TypeScript. **Package manager: yarn** (dùng `yarn`, không dùng `npm`).

## BẮT BUỘC: cổng kiểm tra trước khi commit / push

Gate được **enforce tự động bằng Husky** (git hooks trong `.husky/`):

| Hook | Chạy | Khi nào |
|---|---|---|
| `pre-commit` | `yarn lint && yarn typecheck && yarn test` | mỗi `git commit` |
| `pre-push` | `yarn build && yarn test` (full build: tsc + vite) | mỗi `git push` |

Bất kỳ bước nào fail (exit ≠ 0) → git **tự hủy** commit/push.

Quy tắc:
- **Chỉ commit / push khi gate xanh.** Nếu fail → DỪNG, sửa cho hết lỗi rồi chạy lại, tuyệt đối không commit code đang đỏ.
- Không dùng `git commit --no-verify` / `git push --no-verify` để bỏ qua hook.
- Không "tắt lỗi cho qua": chỉ thêm `eslint-disable` / `@ts-expect-error` khi thật sự cần và phải kèm chú thích `--` giải thích lý do ngay tại dòng đó.
- Nếu sửa lỗi làm thay đổi hành vi (vd: xoá test cho tính năng đã bỏ), nêu rõ trong nội dung commit.

## Lệnh tham chiếu

| Mục đích | Lệnh |
|---|---|
| Lint | `yarn lint` |
| Type-check (chỉ tsc) | `yarn typecheck` |
| Type-check + build | `yarn build` |
| Chạy test | `yarn test` |
| Dev server | `yarn dev` |
| Cài dependency | `yarn add <pkg>` / `yarn add -D <pkg>` |

> Sau khi clone repo, chạy `yarn install` một lần — script `prepare` sẽ tự kích hoạt Husky (trỏ `core.hooksPath` → `.husky/_`). Không cần thao tác thủ công.

## Quy ước code

- Import alias `@/*` trỏ tới `src/*` (cấu hình ở `vite.config.ts`, `vitest.config.ts`, và `tsconfig` qua `paths`).
- `tsconfig` không dùng `baseUrl` (đã deprecated từ TS 7.0); path mapping resolve tương đối với tsconfig — đừng thêm `baseUrl` lại.
