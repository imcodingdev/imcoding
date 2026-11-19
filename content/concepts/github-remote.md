---
id: github-remote
title: Repo trên máy và repo trên GitHub
group: ai-git
prerequisites: [git-commit, secrets]
priority: 1
stage: 2
format: 2
signals: ["origin", "git clone", "git push", "git pull", "remote", "push protection"]
sources:
  - title: GitHub Docs — About repositories
    url: https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories
  - title: GitHub Docs — About remote repositories
    url: https://docs.github.com/en/get-started/git-basics/about-remote-repositories
  - title: GitHub Docs — Push protection
    url: https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection
  - title: GitHub Docs — Removing sensitive data
    url: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
---

## Nhắc lại

### Một commit chứng minh điều gì, và có chứng minh code đã lên mạng không?

Commit lưu một mốc thay đổi trong lịch sử Git. Tạo commit trên máy không đồng nghĩa đã gửi mốc đó tới GitHub, cũng không chứng minh ứng dụng đã triển khai thành công.

### Xóa khóa khỏi file rồi commit lần nữa có làm khóa cũ hết dùng được không?

Không. Khóa vẫn có thể nằm trong lịch sử hoặc bản sao người khác giữ. Phải thu hồi hoặc thay khóa ở nơi cấp khóa; sửa file không thay được quyền của khóa đã lộ.

## Đoán trước

Bạn nhờ Cursor sửa trang giới thiệu. Agent báo “đã commit, đã lưu an toàn”. Bạn tắt máy, đồng nghiệp mở GitHub vẫn thấy bản cũ. Agent đề xuất push ngay nhưng địa chỉ đích lại mang tên tài khoản người đã làm bản mẫu trước đây. Có nên coi đây chỉ là chậm đồng bộ và cho push tiếp không?

### Đáp án

Không. Commit trên máy và commit trên GitHub là hai trạng thái khác nhau. Cần xác nhận thay đổi đã gửi chưa và sẽ gửi tới repo của ai. Nếu địa chỉ đích sai, push có thể đưa code sang nơi bạn không định chia sẻ. Dừng gửi, xác minh chủ repo và địa chỉ trước; việc agent báo đã commit chưa trả lời được hai câu hỏi đó.

## Ví dụ mẫu

**Repository**, thường gọi là repo, là kho chứa code, file và lịch sử sửa đổi. Hãy hình dung bạn có một tập hồ sơ trên bàn, còn nhóm có một tủ hồ sơ chung. Sửa tập trên bàn chưa làm tủ chung đổi theo. Git quản lý lịch sử; GitHub là nơi lưu repo trực tuyến và phối hợp công việc.

Repo có thể thuộc tài khoản cá nhân hoặc một **organization**, không gian để tổ chức cùng quản lý repo và quyền. Khi nhìn địa chỉ `github.com/nhom-demo/app-thu`, phần đầu cho biết chủ sở hữu, phần sau là tên repo. Cùng tên `app-thu` nhưng khác chủ sở hữu vẫn có thể là hai repo khác nhau.

Repo **public** cho mọi người trên Internet truy cập; **private** giới hạn người có quyền. Private không biến repo thành chỗ cất khóa bí mật. Người được cấp quyền, công cụ được kết nối hoặc bản sao đã tải về vẫn cần được quản lý. Trước khi giao agent kết nối, bạn cần biết chủ repo, phạm vi chia sẻ và quyền đang cấp.

**Clone** là lấy một bản sao repo cùng lịch sử về máy. **Remote** là repo ở xa mà bản trên máy liên hệ qua một địa chỉ. Git gắn địa chỉ đó với tên ngắn; tên mặc định thường là `origin`. `origin` không có nghĩa “repo chính chủ” hay “nơi an toàn”: nó chỉ là tên liên kết.

Đọc hai ghi chú minh họa sau, không chạy như lệnh:

```text
SAI: Agent đã commit nên GitHub chắc đã cập nhật.
Bản trên máy: có commit sửa trang giới thiệu.
Bản trên GitHub: chưa có commit đó.
Remote origin: github.com/tai-khoan-cu/app-thu
Rủi ro: gửi code tới chủ repo chưa được xác nhận.
```

```text
ĐÚNG: Kiểm đích gửi trước khi đồng bộ.
Chủ repo thử đã xác nhận: nhom-demo
Repo thử: app-thu, không có khóa hoặc dữ liệu khách
origin -> github.com/nhom-demo/app-thu
Commit: lưu mốc tại repo đang làm việc
Push: gửi các commit của nhánh tới remote được chọn
Pull: lấy và tích hợp thay đổi từ remote vào bản đang làm việc
```

**Push** là chiều gửi đi; **pull** là chiều nhận và tích hợp về. Pull không chỉ là xem bản mới: nó có thể thay đổi code trên máy và cần xử lý xung đột. Trước khi nhờ agent đồng bộ, hỏi nó đang ở repo, nhánh nào, còn thay đổi dở dang không, và định đồng bộ với đâu. Không dùng đồng bộ như một nút “sửa hết lỗi”.

GitHub có **push protection**, cơ chế chặn push khi phát hiện secret thuộc các loại được hỗ trợ và cấu hình áp dụng. Nếu bị chặn, đọc cảnh báo và xử lý nguyên nhân. Đừng bảo agent vượt chặn để kịp giao bài. Push thành công không phải giấy chứng nhận không có secret: phạm vi phát hiện và các ngoại lệ không thay thế việc đọc diff, quản lý khóa và giới hạn quyền.

Nếu khóa thật đã lên GitHub, coi như đã lộ, kể cả repo private. Thu hồi hoặc thay khóa trước tại dịch vụ cấp khóa. Xóa dòng hiện tại chưa xóa lịch sử. Viết lại lịch sử là việc phức tạp, đổi mã commit, ảnh hưởng người cộng tác và không thu lại được bản clone của người khác. Nhờ người có chuyên môn phối hợp xử lý; bài này không hướng dẫn xóa lịch sử hay force push.

## Tìm trong project của bạn

Chỉ quan sát thông tin repo được phép xem; phần thực hành bên dưới dùng repo thử riêng. Không mở file chứa khóa, không chép token hoặc địa chỉ có nhúng thông tin đăng nhập vào chat.

1. Xem tên chủ sở hữu và repo trên GitHub. Ghi `[chủ repo / tên repo / public hay private]`. Ổn: đúng nơi nhóm đã thống nhất. Cần hỏi lại: tên thuộc tài khoản lạ hoặc trạng thái chia sẻ khác dự kiến.
2. Trong giao diện Git của công cụ đang dùng, tìm thông tin `remote`, `origin` hoặc địa chỉ repo liên kết. Ghi `[đích gửi đã xác minh: có/chưa]`, chỉ ghi địa chỉ không chứa thông tin xác thực. Không tự đổi đích khi chưa rõ.
3. Đối chiếu mốc commit agent vừa báo với lịch sử nhánh tương ứng trên GitHub. Ghi `[commit trên máy / đã thấy trên GitHub hay chưa]`. Không thấy thì chưa kết luận đã push; cũng kiểm bạn đang xem đúng nhánh.
4. Xem danh sách file agent định gửi. Chú ý file cấu hình, log, dữ liệu xuất và chuỗi giả như `API_KEY` trong diff. Chỉ ghi tên file và loại nghi vấn, không sao chép giá trị. Không có file tên `.env` chưa chứng minh khóa không nằm trong code.
5. Nếu có cảnh báo push protection, ghi loại cảnh báo và phần việc cần sửa. Ổn: xử lý secret trước khi gửi lại. Có vấn đề: agent đề nghị bỏ qua cảnh báo mà chưa xác minh.

## Tự giải thích

### Vì sao hai máy cùng clone một repo có thể hiển thị code khác nhau?

Mỗi máy có bản làm việc và lịch sử đã nhận tại thời điểm riêng. Một máy có commit chưa push; máy kia có thể chưa lấy thay đổi mới hoặc đang xem nhánh khác. Muốn so sánh phải biết repo, nhánh và mốc commit, không chỉ tên thư mục.

### Vì sao cần kiểm chủ sở hữu dù remote đã tên là `origin`?

Tên ngắn không xác nhận danh tính nơi nhận. Nó có thể trỏ tới repo mẫu, fork hoặc nơi người cũ đã cấu hình. Đọc địa chỉ và đối chiếu quyền sở hữu giúp tránh gửi code ra ngoài phạm vi đã thống nhất.

### Vì sao thu hồi khóa phải đi trước dọn lịch sử?

Thu hồi cắt khả năng dùng khóa cũ. Dọn lịch sử mất thời gian và không đảm bảo xóa mọi bản sao. Nếu mải dọn mà khóa còn hiệu lực, người giữ bản sao vẫn có thể sử dụng trong lúc bạn xử lý.

## Trắc nghiệm

### Claude Code báo “commit thành công”, nhưng đồng nghiệp chưa thấy trên GitHub. Bạn kiểm gì trước?

- [x] Đúng repo, nhánh, mốc commit và kết quả push, thay vì suy từ commit
- [ ] Cứ refresh trình duyệt vì commit tự gửi lên GitHub
- [ ] Chuyển repo sang public để đồng nghiệp thấy ngay
- [ ] Cho agent tạo lại repo để đồng bộ từ đầu

**Giải thích:** Commit tại máy chưa phải push. Refresh không đưa thay đổi chưa gửi lên, còn đổi public làm thay phạm vi chia sẻ mà không giải quyết bước còn thiếu.

### Agent sắp gửi code và ghi `origin -> github.com/nguoi-cu/app-thu`. Điều nào hợp lý?

- [ ] Cho gửi vì tên `origin` luôn là repo chính của bạn
- [x] Dừng gửi, xác minh chủ repo và đích được phép nhận code
- [ ] Chỉ đổi tên thư mục trên máy thành tên công ty
- [ ] Cho push trước rồi kiểm quyền sau

**Giải thích:** Remote là liên kết tới địa chỉ, không phải dấu chứng nhận. Đổi tên thư mục không đổi chủ sở hữu ở GitHub; kiểm sau push có thể quá muộn.

### Push không bị chặn. Kết luận nào đúng?

- [ ] GitHub đã xác nhận không còn khóa trong lịch sử
- [ ] Repo private nên không cần kiểm secret
- [x] Vẫn cần kiểm thay đổi; push protection có phạm vi phát hiện và cấu hình cụ thể
- [ ] Mọi khóa đã gửi tự hết hiệu lực

**Giải thích:** Không có cảnh báo không chứng minh không có secret. GitHub không thay bạn thu hồi khóa ở nhà cung cấp chỉ vì bạn gửi code.

### Khóa thật từng được push rồi bị xóa trong commit mới. Hành động ưu tiên là gì?

- [ ] Chờ xem có ai dùng khóa rồi mới xử lý
- [ ] Chỉ chuyển repo sang private
- [ ] Nhờ agent xóa lịch sử ngay để khỏi phải đổi khóa
- [x] Thu hồi hoặc thay khóa, rồi phối hợp xử lý phần dữ liệu còn lưu

**Giải thích:** Khóa còn hiệu lực vẫn dùng được từ bản sao. Dọn lịch sử khó và không thu hồi quyền của khóa; đổi phạm vi repo cũng không thu lại bản đã tải.

## Kiểm tra không dùng AI

### Một cộng tác viên nghỉ dự án. Máy bạn vẫn clone từ repo private của họ, trong khi nhóm đã lập repo mới. Bạn có thể chỉ nói “pull bản mới nhất” để chuyển sang repo của nhóm không? Nêu cách kiểm và lý do.

#### Đáp án

Không. Pull làm việc với remote đang cấu hình, không tự biết nhóm đã đổi nơi lưu code. Đối chiếu địa chỉ remote, chủ repo, nhánh và mốc cần dùng với người quản lý. Chưa xác minh thì không đồng bộ. Nếu cần bản clone của repo mới, làm riêng ở nơi được phép, giữ thay đổi dở dang để kiểm trước. Không đưa khóa hay dữ liệu khách vào cuộc trao đổi.

## Lỗi suy luận hay gặp

### “Có Git là đã có bản sao trên GitHub”

Git lưu lịch sử tại repo đang làm việc. Muốn có bản trên GitHub cần gửi tới đúng remote và kiểm kết quả. Hãy yêu cầu agent phân biệt đã sửa, đã commit và đã push trong báo cáo.

### “Private nghĩa là khóa không thể lộ”

Private giới hạn người truy cập repo; nó không quản lý vòng đời của khóa bên ngoài. Không commit khóa vào repo private, và vẫn thu hồi khóa đã lộ thay vì tin vào nhãn private.

### “Pull chỉ tải xuống nên không ảnh hưởng việc đang làm”

Pull còn tích hợp thay đổi. Khi hai bên cùng sửa, cần xem tình trạng bản làm việc và xử lý khác biệt. Nếu chưa hiểu agent định làm gì với phần đang sửa, dừng để kiểm trước.

## Bài tập thực hành

Mục tiêu: phân biệt bản trên máy với bản trên GitHub qua ghi chú chỉ đọc. Chỉ dùng repo thử không có khóa, dữ liệu thật hoặc kết nối triển khai thật; không thao tác trên repo sản phẩm.

### Việc cần làm

1. Chọn repo thử do bạn sở hữu hoặc được phép quan sát. Ghi tên chủ, tên repo và phạm vi public/private.
2. Nếu có bản clone thử trên máy, xem thông tin remote trong công cụ Git; nếu chưa có, dùng ảnh hoặc ghi chú repo thử do người hướng dẫn cung cấp, không cần kết nối repo thật.
3. Chọn một mốc commit trên nhánh thử, đối chiếu với cùng nhánh trên GitHub và ghi có khớp không.
4. Viết tình huống “commit mới chỉ ở máy” và “người khác cập nhật trên GitHub”, nêu chiều push/pull tương ứng và điều cần kiểm trước.
5. Viết quy trình xử lý khóa giả bị lộ bằng lời. Không đưa khóa thật lên để thử chặn; không push, xóa lịch sử hay force push trong bài tập này.

### Kết quả đúng

Bạn chỉ được nơi lưu từng bản, đích của `origin`, và phân biệt lưu commit với đồng bộ. Ghi chú xử lý khóa đặt thu hồi trước dọn lịch sử, không có secret hoặc thay đổi nào trên repo thật.
