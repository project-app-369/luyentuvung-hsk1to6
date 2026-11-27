# Luyện từ vựng HSK1 - HSK6

Ứng dụng `luyentuvung-hsk1to6`: Ink and Paper, dark theme lan tỏa, PWA, HSK 1–6 và bốn bộ học bổ sung. 5.002 mục, mỗi mục 5 ví dụ có pinyin, tiếng Việt và nút nghe.

## Chạy / triển khai

Đưa toàn bộ **nội dung** `dist/` lên CDN hoặc shared hosting có HTTPS. Không cần Node hay backend. Hỗ trợ đường dẫn con như GitHub Pages. Chạy thử bằng `python -m http.server 8080 --directory dist`. Mở qua HTTP/HTTPS để dùng PWA.

PWA lưu phần học cơ bản sau lần tải đầu. Trong Thiết lập, chọn Tải trọn bộ để lưu thêm toàn bộ ví dụ, nét viết và font mở rộng. Giọng Mandarin phụ thuộc thiết bị, có thể cần mạng. Tiến độ lưu trên thiết bị; đăng nhập Google hoặc email để đồng bộ riêng theo tài khoản. Nút cài hỗ trợ lời mời cài đặt hoặc hướng dẫn theo trình duyệt.

Ví dụ dịch tự động và được rà soát theo mẫu, chưa phải toàn bộ nội dung đã được giáo viên kiểm duyệt. Giấy phép và ghi công trong `dist/attribution.json`.
