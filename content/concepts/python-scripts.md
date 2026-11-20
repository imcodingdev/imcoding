---
id: python-scripts
title: Chạy script Python do AI viết
group: systems
prerequisites: [package-dependencies, secrets, debugging]
priority: 2
stage: 2
format: 2
signals: [".py", "venv", "pip install", "requirements.txt", "Traceback", "ModuleNotFoundError"]
sources:
  - title: Python Docs — Virtual Environments and Packages
    url: https://docs.python.org/3/tutorial/venv.html
  - title: Python Docs — venv
    url: https://docs.python.org/3/library/venv.html
  - title: Python Packaging — pip and virtual environments
    url: https://packaging.python.org/en/latest/guides/installing-using-pip-and-virtual-environments.html
  - title: pip Docs — Requirements File Format
    url: https://pip.pypa.io/en/stable/reference/requirements-file-format/
  - title: pip Docs — User Guide
    url: https://pip.pypa.io/en/stable/user_guide/
  - title: Python Docs — Using Python on Windows
    url: https://docs.python.org/3/using/windows.html
  - title: Python Docs — Using Python on macOS
    url: https://docs.python.org/3/using/mac.html
  - title: Python Docs — Command line and environment
    url: https://docs.python.org/3/using/cmdline.html
  - title: Python Docs — os
    url: https://docs.python.org/3/library/os.html
  - title: Python Docs — pathlib
    url: https://docs.python.org/3/library/pathlib.html
  - title: Python Docs — Errors and Exceptions
    url: https://docs.python.org/3/tutorial/errors.html
---

## Nhắc lại

### Cài thư viện thành công có chứng minh code AI viết an toàn không?

Không. Như bài [Thư viện và gói phụ thuộc](/concepts/package-dependencies), bạn còn phải kiểm tên gói, nguồn và tính tương thích. Cài được không chứng minh script chỉ làm việc bạn muốn.

### Khi nhờ AI xem lỗi, nên gửi gì và giữ lại gì?

Gửi bước tái hiện, kỳ vọng, lỗi nguyên văn đã che thông tin nhạy cảm. Không gửi khóa bí mật; xem lại [Secrets](/concepts/secrets) và [Debugging](/concepts/debugging).

## Đoán trước

Bạn nhờ AI gộp CSV. Agent gửi `gop.py` và bảo cài thư viện rồi chạy. Bạn mở terminal ngay trong thư mục hóa đơn thật. Script chạy xong nhưng ghi đè file tổng hợp cũ. Agent nói “đã dùng môi trường ảo nên an toàn”. Môi trường ảo có bảo vệ file của bạn không?

### Đáp án

Không. Môi trường ảo tách bộ thư viện, không giới hạn quyền đọc, ghi, xóa file hay gọi mạng. Trước khi chạy phải biết script chạm tới đâu, thử bằng dữ liệu giả và kiểm kết quả. Không lấy dữ liệu thật làm lần thử đầu tiên.

## Ví dụ mẫu

**Script Python** là file lệnh, thường có đuôi `.py`, được chương trình Python đọc và thực hiện. **Terminal** là cửa sổ nhập lệnh của máy hoặc trình soạn thảo. Bạn chạy ở đó, không dán lệnh vào chat hay ô có dấu `>>>` của Python.

Khi Python đã được cài, dạng chạy thông thường là `python3 file.py` trên macOS/Linux; Windows có Python install manager hoặc launcher dùng `py file.py`. Thay `file.py` bằng tên thật. Nếu chưa có Python hoặc lệnh không được nhận diện, dừng và nhờ người hỗ trợ thiết lập; đừng tự thử quyền admin.

Mở terminal tại thư mục thử chứa `gop.py`. Đường dẫn tương đối như `input/a.csv` thường được tính từ **thư mục đang đứng**, không tự động từ nơi lưu script. Script cũng có thể đổi thư mục hoặc tự dựng đường dẫn khác: phải xem cách nó chọn đầu vào, đầu ra.

**venv** là môi trường thư viện riêng cho mỗi project. Hai script có thể cần hai phiên bản khác nhau của cùng thư viện; cài chung dễ làm script này chạy nhưng script kia hỏng. Tạo venv giống chuẩn bị một hộp dụng cụ riêng, không phải dựng hàng rào quanh dữ liệu.

Dạng tổng quát là `python -m venv .venv`. Chỉ chọn khối phù hợp với máy, khi Python đã sẵn sàng. Ví dụ macOS/Linux với bash hoặc zsh:

```bash
python3 -m venv .venv       # Tạo môi trường trong thư mục thử
source .venv/bin/activate  # Dùng Python của môi trường này
python -m pip --version    # Đường dẫn pip phải nằm trong .venv
python gop.py              # Chỉ chạy sau khi đã rà script và dữ liệu
```

Windows với PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip --version    # Kiểm pip thuộc .venv của thư mục thử
python gop.py              # Cùng Python dùng để quản lý gói
```

Nếu dùng Command Prompt (`cmd.exe`), lệnh kích hoạt là `.venv\Scripts\activate.bat`. Nếu PowerShell chặn kích hoạt, không cần đổi chính sách bảo mật: gọi trực tiếp `.\.venv\Scripts\python.exe gop.py`. Cùng cách đó, kiểm pip bằng `.\.venv\Scripts\python.exe -m pip --version`. Trên macOS/Linux, Python tương ứng là `.venv/bin/python`.

**pip** là công cụ cài gói Python. Sau khi xác nhận pip nằm trong đúng `.venv`, đọc `requirements.txt`: danh sách gói và điều kiện phiên bản script cần. File có thể chứa cả URL hoặc tham chiếu file khác, nên không cài mù quáng. Nhờ agent giải thích từng mục và nguồn tải trước.

`pip install -r requirements.txt` cài theo danh sách. Nên dùng `python -m pip install -r requirements.txt` để gắn pip với chính Python sẽ chạy script. Lệnh có thể tải gói từ mạng; chỉ thực hiện khi đã duyệt danh sách. Không cài vào Python hệ thống, không dùng `sudo` hoặc quyền admin để vượt lỗi. Bài tập cuối không cần cài gói ngoài.

Không đưa `.venv` vào Git; thêm `.venv/` vào `.gitignore` và kiểm danh sách file trước [commit](/concepts/git-commit). Giữ script và danh sách gói cần thiết, không cất script bên trong `.venv`. Mở terminal mới thì kích hoạt lại hoặc gọi trực tiếp Python của venv.

Trước khi chạy, tìm nơi đọc, ghi, xóa: `Path.open`, `Path.write_text`, `Path.unlink`, `os.remove` là những dấu hiệu cần xem. `Path.write_text` ghi đè file cùng tên; `Path.unlink` và `os.remove` có thể xóa file. Đây chỉ là dấu hiệu, không phải danh sách đầy đủ. Nhờ agent chỉ cả nơi gọi mạng, địa chỉ nhận và dữ liệu gửi đi, kể cả qua thư viện.

Với script gọi API, khóa nên được cấp qua [biến môi trường](/concepts/environment-variables), đọc bằng `os.environ`, không dán vào code hay chat. Chỉ trao đổi tên như `API_KEY`, không giá trị. Biến môi trường không tự ngăn script in khóa ra log; vẫn phải rà chỗ ghi log và gửi mạng.

Khi lỗi, đọc **traceback**, phần chỉ dấu đường đi tới lỗi: dòng cuối thường có loại lỗi và mô tả, các dòng trên chỉ file, số dòng và ngữ cảnh. `ModuleNotFoundError` thường là thiếu gói hoặc đang chạy Python ngoài venv; cũng có thể AI viết sai tên import. Kiểm môi trường trước, đừng thấy tên lỗi là cài ngay một gói cùng tên.

## Tìm trong project của bạn

Chỉ đọc script được phép xem, chưa chạy trên project thật. Không mở file chứa khóa.

1. Tìm `.py` và `requirements.txt`. Ghi `[script / mục đích / gói ngoài cần dùng]`. Không có danh sách gói thì yêu cầu agent làm rõ, không đoán tên gói.
2. Xem terminal định chạy ở đâu. Ghi `[thư mục hiện tại / đường dẫn Python / đường dẫn pip]`; kiểm pip bằng lệnh ở ví dụ. Chưa thấy `.venv` đúng project thì chưa cài gì.
3. Tìm thao tác file và mạng. Yêu cầu agent liệt kê `[file đọc / file ghi hoặc xóa / đích mạng / dữ liệu gửi]`, kèm dòng code. Đối chiếu cả thư mục cha và đường dẫn tuyệt đối.
4. Tìm tên `API_KEY`, `os.environ` và chỗ ghi log, chỉ ghi `[nguồn cấp khóa / có nguy cơ lộ không]`. Không chép giá trị vào báo cáo.
5. Nếu có lỗi cũ, ghi `[lệnh đã chạy / thư mục / dòng cuối traceback / file và dòng liên quan]`. Che khóa và dữ liệu riêng trước khi nhờ AI giải thích nguyên nhân.

## Tự giải thích

### Vì sao kích hoạt venv rồi vẫn phải đọc script?

Venv chọn Python và thư viện; script vẫn có quyền của tài khoản đang chạy. Nó có thể ghi đè file ngoài thư mục thử nếu code trỏ tới đó. Phạm vi thao tác phải được kiểm riêng.

### Vì sao dùng `python -m pip` và `python gop.py` cùng một terminal?

Để cài gói và chạy script bằng cùng Python đã chọn. Một lệnh `pip` ở nơi khác có thể cài cho Python khác. Terminal mới cũng không mặc nhiên giữ môi trường đã kích hoạt ở cửa sổ cũ.

### Vì sao kết quả “không báo lỗi” chưa đủ?

Script có thể chạy hết nhưng gộp thiếu dòng hoặc ghi sai nơi. Cần biết trước file đầu ra và nội dung kỳ vọng, rồi đối chiếu; đồng thời kiểm file nguồn còn nguyên.

## Trắc nghiệm

### Cursor đề nghị chạy `python gop.py` khi terminal đang ở thư mục hóa đơn thật. Bước nào nên làm trước?

- [x] Rà phạm vi file và mạng, chuẩn bị thư mục thử với dữ liệu giả
- [ ] Kích hoạt venv rồi chạy ngay vì file thật đã được bảo vệ
- [ ] Chạy một lần để biết script sẽ tạo gì
- [ ] Chỉ lưu một commit là đủ để khôi phục mọi file dữ liệu

**Giải thích:** Phải biết phạm vi trước khi chạy. Venv không bảo vệ file; Git cũng không chắc lưu những file dữ liệu chưa được theo dõi.

### AI bảo “đã cài gói”, nhưng terminal mới báo `ModuleNotFoundError`. Bạn kiểm gì trước?

- [ ] Cài lại gói vào Python hệ thống để mọi script đều thấy
- [x] Python chạy script và pip cài gói có thuộc cùng venv không
- [ ] Chạy với quyền admin để Python nhìn thấy gói
- [ ] Xóa dòng import vì đó là dòng được traceback chỉ ra

**Giải thích:** Gói có thể nằm ở môi trường khác. Cài toàn máy không xử lý việc chọn sai Python; bỏ import có thể khiến chức năng cần thiết không chạy.

### Trong script có `Path.write_text` ghi ra tên file báo cáo đã tồn tại. Nhận định nào đúng?

- [ ] Python tự tạo một bản sao trước khi ghi
- [ ] Có `.venv` thì thao tác chỉ tác động bên trong `.venv`
- [x] File có thể bị ghi đè; cần đổi đầu ra và thử bằng dữ liệu giả
- [ ] Chỉ thao tác xóa file mới có nguy cơ mất dữ liệu

**Giải thích:** Ghi đè cũng làm mất nội dung cũ. Môi trường thư viện không đổi ý nghĩa thao tác ghi file.

### Agent cần khóa API để thử script. Cách nào phù hợp?

- [ ] Dán khóa vào script rồi xóa sau khi chạy
- [ ] Gửi khóa vào chat để agent điền hộ
- [ ] Cất khóa trong `.venv` vì thư mục này thường bị ẩn
- [x] Cấp qua biến môi trường, rà việc đọc khóa, log và đích mạng

**Giải thích:** Script có thể đọc qua `os.environ`; không cần nhúng khóa vào code. Thư mục ẩn và việc xóa sau không thu hồi được bản sao đã lộ.

## Kiểm tra không dùng AI

### Bạn nhận script đổi tên ảnh. Agent muốn chạy trên thư mục ảnh sản phẩm, dùng đường dẫn `../anh`, rồi tự xóa ảnh “trùng”. Dù venv đã đúng, bạn cần thay đổi kế hoạch thế nào và vì sao?

#### Đáp án

Chưa chạy. Xác định `../anh` được tính từ đâu, liệt kê ảnh bị đổi tên hoặc xóa. Yêu cầu bỏ thao tác xóa khỏi lần thử, dùng thư mục riêng với ảnh giả tự tạo và đầu ra riêng. Rà cả đường dẫn ngoài phạm vi rồi mới thử; đối chiếu tên trước và sau. Venv chỉ tách thư viện, không hạn chế quyền xóa ảnh thật.

## Lỗi suy luận hay gặp

### “Có venv là script bị nhốt trong thư mục thử”

Sai vì venv không phải môi trường cách ly quyền truy cập file. Kiểm đường dẫn và mạng, không chỉ nhìn dấu `.venv` trên terminal.

### “Thiếu gói thì cứ cài tên được báo trong lỗi”

Tên import chưa chắc là tên gói cần cài, và có thể bạn đang chạy nhầm Python. Kiểm môi trường, danh sách yêu cầu và nguồn gói trước; không dùng quyền cao để ép cài.

### “Agent liệt kê file rồi thì khỏi đối chiếu”

Agent có thể bỏ sót thao tác gián tiếp qua thư viện. Đọc các dòng được dẫn, kiểm đầu ra bằng dữ liệu giả; chưa hiểu phạm vi thì chưa chạy.

## Bài tập thực hành

Mục tiêu: gộp dữ liệu giả và chứng minh file nguồn còn nguyên. Chỉ dùng thư mục thử mới với file mẫu tự tạo, không chạy trên dữ liệu thật, không dùng khóa hay gọi API.

### Việc cần làm

1. Tạo thư mục `python-thu` bằng trình quản lý file. Dùng trình soạn thảo tạo `a.csv`, `b.csv`, cùng cột `ten`, mỗi file một dòng giả: `Mau A`, `Mau B`. Giữ bản ghi nội dung để đối chiếu.
2. Nhờ AI viết `gop.py` chỉ dùng thư viện chuẩn, đọc đúng hai file đó, tạo `ket-qua.csv` với một tiêu đề và hai dòng dữ liệu. Yêu cầu dừng nếu đầu ra đã tồn tại; không xóa, đổi tên, ghi đè hay gọi mạng.
3. Trước khi chạy, đọc script và yêu cầu liệt kê file đụng tới kèm dòng code. Xác nhận mọi đường dẫn nằm trong thư mục thử. Chưa hiểu thì dừng để làm rõ.
4. Khi máy đã có Python, mở terminal tại `python-thu`, tạo và chọn venv theo ví dụ. Không cần `pip install` cho bài này. Nếu thiếu Python hoặc không tạo được venv, ghi lỗi và nhờ hỗ trợ, không cài vào hệ thống hay dùng `sudo`/admin.
5. Chạy `python gop.py` bằng venv đã xác nhận, hoặc đường dẫn Python trực tiếp ở ví dụ. Mở đầu ra để đối chiếu hai dòng giả và kiểm hai file nguồn không đổi. Không chạy lại khi đầu ra còn đó.
6. Ghi lệnh, thư mục, kết quả kỳ vọng và thực tế. Nếu có traceback, ghi loại lỗi cùng file, số dòng; chưa sửa mò hay thử lại trên dữ liệu thật.

### Kết quả đúng

`ket-qua.csv` có một tiêu đề và đủ hai dòng giả; hai file nguồn còn nguyên, không có thao tác ngoài thư mục thử. Nếu bị lỗi, có bản ghi đủ để khoanh vùng, chưa coi là hoàn thành chỉ vì AI báo “xong”.
