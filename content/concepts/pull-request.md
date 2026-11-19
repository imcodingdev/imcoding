---
id: pull-request
title: Đọc và duyệt Pull Request do agent mở
group: ai-git
prerequisites: [git-branch-merge, github-remote, code-review]
priority: 1
stage: 2
format: 2
signals: ["Files changed", "Commits", "Checks", "Approve", "Request changes", "Squash and merge"]
sources:
  - title: GitHub Docs — About pull requests
    url: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests
  - title: GitHub Docs — About issues
    url: https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues
  - title: GitHub Docs — Branch for an issue
    url: https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-a-branch-for-an-issue
  - title: GitHub Docs — Pull request reviews
    url: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews
  - title: GitHub Docs — Pull request merges
    url: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges
  - title: GitHub Docs — Automatic branch deletion
    url: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches
  - title: GitHub Docs — About protected branches
    url: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
---

## Nhắc lại

### Push một nhánh thử có đồng nghĩa đã hợp nhất vào nhánh chính không?

Không. Push gửi commit tới remote; merge đưa thay đổi từ nhánh này vào nhánh khác. Cần kiểm đúng nhánh nguồn và nhánh đích, không suy từ việc code đã có trên GitHub.

### Khi đọc diff, vì sao phải chú ý dòng bị xóa?

Nó có thể là kiểm tra quyền, điều kiện nghiệp vụ hoặc test bị bỏ. Tính năng mới chạy được chưa chứng minh hành vi cũ vẫn được giữ, nên phải đối chiếu diff với phạm vi đã giao.

## Đoán trước

Bạn giao agent thêm thông báo lỗi đăng nhập. Nó mở Pull Request tên “Cải thiện login”, báo kiểm tra xanh. Bạn thấy nút merge dùng được, nhưng trong Files changed có cả file phân quyền và test bị xóa. Có nên merge vì GitHub đã cho phép không?

### Đáp án

Chưa. GitHub cho biết các điều kiện kỹ thuật đang cho phép hợp nhất, không xác nhận thay đổi đúng yêu cầu. Cần đọc diff các file ngoài phạm vi, yêu cầu giải thích test bị xóa và kiểm lại tình huống đăng nhập lỗi. Nếu chưa đủ bằng chứng, yêu cầu sửa; nút merge không thay quyết định của người nhận tính năng.

## Ví dụ mẫu

**Pull Request**, viết tắt PR, là đề nghị hợp nhất thay đổi từ một nhánh vào nhánh khác. Nó gom mô tả, trao đổi, commit, kết quả kiểm và diff vào một nơi để mọi người xem trước khi nhận code. PR không phải lệnh `git pull`, cũng không phải bản ứng dụng đã đưa cho khách.

Một nhóm có thể dùng **issue**, phiếu ghi việc hoặc lỗi, để nói rõ cần làm gì. Ví dụ issue yêu cầu màn hình login báo lỗi dễ hiểu khi thông tin không hợp lệ; không thay cơ chế xác thực. Agent làm trên nhánh riêng cho issue, commit phần thay đổi, push nhánh rồi mở PR. Mỗi bước có mục đích: issue chốt việc, nhánh tách thay đổi, PR là nơi kiểm và quyết định.

GitHub hỗ trợ tạo nhánh từ phần **Development** của issue qua **Create a branch** khi có quyền ghi và tính năng hiện diện. PR từ nhánh đã liên kết sẽ nối với issue. Bạn vẫn phải đọc nhánh đích: **base** là nhánh nhận thay đổi; **head** là nhánh đề xuất. Tên nhánh đúng chủ đề không bảo đảm base đúng.

```text
Issue thử: Thông báo login sai phải dễ hiểu
Phạm vi: màn hình login và test thông báo
Không đổi: quyền truy cập, cấu hình triển khai
Head: thu-login-message
Base: thu-tich-hop
PR cần có: mục đích, diff, cách kiểm, phần chưa kiểm
```

Trong PR, **Conversation** chứa mô tả và trao đổi; **Commits** cho thấy nhánh thay đổi qua các mốc; **Checks** cho xem kiểm tự động nếu repo có cấu hình; **Files changed** chứa diff cần đọc. Đọc mô tả để hiểu ý định, rồi đối chiếu Files changed để biết thực tế. Nếu agent sửa thêm sau review, xem phần mới trước khi quyết định tiếp.

```diff
// Diff minh họa: yêu cầu chỉ đổi thông báo đăng nhập
- if (!user) return rejectLogin()
+ // Tạm bỏ chặn để kiểm tra giao diện
```

Đây không còn là sửa câu chữ. Bước chặn đã bị bỏ. Một phản hồi hữu ích chỉ đúng file, dòng và yêu cầu: “Giữ kiểm tra người dùng; sửa thông báo trong phạm vi; bổ sung bằng chứng trường hợp không hợp lệ vẫn bị từ chối”. “Xem lại nhé” khiến agent phải đoán điều bạn muốn sửa.

Khi gửi review, **Comment** chỉ để lại nhận xét, không thể hiện chấp thuận hay yêu cầu sửa. **Approve** thể hiện sẵn sàng hợp nhất. **Request changes** yêu cầu tác giả xử lý phản hồi trước khi merge. Khả năng chặn merge còn phụ thuộc quy tắc nhánh và quyền, không phải cứ viết một bình luận là đã khóa PR. Approve cũng không tự thực hiện merge.

Ba cách hợp nhất tạo lịch sử khác nhau. **Merge commit** giữ các commit của nhánh và thêm mốc hợp nhất. **Squash and merge** gom thay đổi của PR thành một commit trên nhánh đích, phù hợp một việc có nhiều commit chỉnh nhỏ. **Rebase and merge** đưa từng commit lên nhánh đích theo lịch sử thẳng, không có merge commit; trên GitHub chúng nhận mã commit mới. Chọn theo quy ước nhóm và lựa chọn repo cho phép, không coi cách nào là cơ chế kiểm an toàn.

Merge khi đúng phạm vi, đã xử lý phản hồi, kiểm cần thiết đủ bằng chứng và đúng base. Nếu việc bị hủy, trùng đề xuất khác hoặc hướng giải quyết không còn dùng, đóng PR mà không merge và ghi lý do. Nếu vẫn đang sửa, tiếp tục trao đổi hoặc dùng draft; PR dạng draft chưa thể merge. Không merge một đề xuất sai chỉ để danh sách PR bớt dài.

Sau merge, có thể dọn head branch đã hết việc. Quản trị repo có thể dùng **Settings → General → Pull Requests → Automatically delete head branches**. Quy tắc nhánh có thể ngăn xóa. Với PR từ fork, cài đặt ở fork và quyền ghi của người merge tại fork quyết định việc tự xóa. Dọn nhánh không có nghĩa xóa lịch sử đã hợp nhất, và không dùng làm cách xử lý secret đã lộ.

## Tìm trong project của bạn

Chỉ đọc PR bạn được phép xem, không bấm approve hoặc merge khi đang khảo sát. Nếu không có PR phù hợp, dùng repo thử ở bài tập.

1. Mở mô tả và issue liên quan. Ghi `[việc cần làm / phạm vi / tiêu chí]`. Ổn: có hành vi quan sát được. Cần hỏi lại: chỉ ghi “đã sửa mọi thứ”.
2. Xác định `[head / base / trạng thái draft hay sẵn sàng review]`. Kiểm base đúng nơi nhận việc, không nhầm nhánh phát hành hay nhánh thử khác.
3. Mở Files changed, xem tên file rồi các dòng thêm, xóa. Tìm `auth`, `policy`, `.skip` và file `.github/workflows/` nếu xuất hiện trong diff. Ghi `[file ngoài phạm vi / câu hỏi]`, không chép secret.
4. Xem Commits và kết quả Checks hiện tại. Ghi `[mốc đang review / kiểm đã chạy / kiểm chưa chạy]`. Màu xanh thiếu phép thử cho yêu cầu vẫn là thiếu bằng chứng.
5. Đọc review và phần trạng thái merge. Ghi `[phản hồi chưa xử lý / quy tắc đang chặn / quyết định đề xuất]`. Phân biệt “có thể merge” với “đã đủ cơ sở để merge”.

## Tự giải thích

### Vì sao đã có commit nhỏ còn cần PR?

Commit lưu các mốc công việc; PR đặt cả đề xuất vào bối cảnh để người khác kiểm. Nhóm thấy mục đích, thảo luận và diff trước khi nhận vào base, thay vì phải suy ý định từ từng tên commit riêng lẻ.

### Vì sao squash không làm một PR ngoài phạm vi trở nên dễ chấp nhận?

Squash đổi cách ghi lịch sử, không tự loại dòng ngoài phạm vi. Nếu PR vừa sửa giao diện vừa bỏ kiểm tra quyền, gom thành một commit vẫn giữ cả hai. Phải sửa nội dung trước khi chọn cách merge.

### Nếu agent push thêm sau khi bạn approve thì cần làm gì?

Đọc phần thay đổi mới và xem bằng chứng kiểm tương ứng. Quy tắc repo có thể hủy approval cũ hoặc yêu cầu review lượt push mới; dù giao diện còn approval, bạn vẫn cần biết phiên bản mình chấp nhận là phiên bản nào.

## Trắc nghiệm

### Agent mở PR sửa nhãn nút, Files changed có thêm thay đổi quyền. Bạn chọn gì?

- [x] Yêu cầu giải thích và sửa phần ngoài phạm vi trước khi nhận
- [ ] Approve vì tiêu đề PR đúng việc đã giao
- [ ] Squash để phần ngoài phạm vi không còn trong code
- [ ] Chỉ đọc commit cuối, bỏ qua diff tổng

**Giải thích:** Diff thể hiện đề xuất thực tế. Squash không xóa hành vi ngoài yêu cầu; tiêu đề và commit cuối có thể bỏ sót phần thay đổi trước đó.

### Cursor báo “đã Comment yêu cầu sửa, PR chắc chắn bị chặn”. Điều nào đúng?

- [ ] Comment luôn khóa nút merge cho mọi người
- [x] Comment chỉ là phản hồi; cần phân biệt Request changes và quy tắc review bắt buộc
- [ ] Mọi comment đều tương đương Approve
- [ ] Chỉ tác giả PR mới có thể đọc comment

**Giải thích:** Ba quyết định review có nghĩa khác nhau. Muốn dựa vào cơ chế chặn phải kiểm quy tắc áp dụng, không suy từ một câu bình luận.

### Một PR cho một việc chứa nhiều commit chỉnh nhỏ. Nhóm muốn một commit trên base. Lựa chọn nào phù hợp nếu repo cho phép?

- [ ] Merge commit, vì nó luôn bỏ các commit trung gian
- [ ] Rebase and merge, vì nó luôn gộp thành một commit
- [x] Squash and merge sau khi nội dung đã được kiểm
- [ ] Đóng PR để các commit tự đi vào base

**Giải thích:** Squash gom thành một commit. Rebase giữ từng commit theo lịch sử thẳng, còn đóng PR không phải thao tác nhận thay đổi.

### Tính năng trong PR đã bị hủy, code vẫn build xanh. Bạn làm gì?

- [ ] Merge vì CI không còn lỗi
- [ ] Approve rồi đợi người khác tự hiểu việc đã hủy
- [ ] Đổi tên PR thành “xong” nhưng không giải thích
- [x] Đóng PR không merge và ghi lý do không tiếp tục

**Giải thích:** Kiểm kỹ thuật qua không làm đề xuất trở nên cần thiết. Đóng kèm lý do giữ được bối cảnh và tránh nhận code không còn dùng.

## Kiểm tra không dùng AI

### Nhóm định đưa sửa lỗi tìm kiếm vào nhánh thử, nhưng PR có base là nhánh phát hành. Review cũ đã approve; sau đó agent thêm commit đổi cấu hình. Hãy nêu việc cần kiểm trước khi ra quyết định.

#### Đáp án

Chưa merge. Xác minh và chỉnh lại đề xuất về đúng nhánh đích theo quy trình nhóm, xem diff tương ứng sau đó. Đọc commit đổi cấu hình, hỏi lý do và phạm vi; approval cũ chưa chứng minh phần mới đã được kiểm. Chạy hoặc xem kiểm liên quan trên phiên bản mới rồi quyết định nhận, yêu cầu sửa hay đóng nếu đề xuất không còn phù hợp.

## Lỗi suy luận hay gặp

### “Agent mở PR nghĩa là đã đưa code cho khách”

PR là đề xuất giữa hai nhánh. Việc triển khai phụ thuộc hệ thống và nhánh được cấu hình. Hãy kiểm trạng thái PR và môi trường triển khai riêng, không suy từ lời “PR đã mở”.

### “Approve là đã merge”

Approve thể hiện quyết định review; merge là hành động nhận thay đổi. PR còn có thể vướng kiểm bắt buộc, xung đột hoặc review khác. Đọc trạng thái hiện tại thay vì dựa vào một nhãn.

### “Xóa nhánh sau merge là xóa cả bằng chứng”

Dọn nhánh đã xong không phải dọn lịch sử đã hợp nhất. Giữ PR và thông tin kiểm để tra lại, chỉ dọn head branch khi nó không còn việc; không xóa nhánh người khác đang dùng.

## Bài tập thực hành

Mục tiêu: đọc một PR nhỏ và viết quyết định có lý do. Chỉ dùng repo thử với hai nhánh thử; không mở PR hay thao tác trên repo sản phẩm, không nối dịch vụ thật.

### Việc cần làm

1. Trong repo thử, chuẩn bị issue sửa câu chữ trong một file ghi chú, có tiêu chí cụ thể. Chọn nhánh thử làm base.
2. Từ base thử, dùng một nhánh thử khác cho thay đổi câu chữ; tạo commit và PR trong repo thử hoặc dùng PR mẫu người hướng dẫn đã chuẩn bị.
3. Ghi head, base; đọc Conversation, Commits và Files changed. Ghi Checks có gì hoặc chưa được cấu hình, không tự coi là xanh.
4. Viết nhận xét chỉ rõ dòng thay đổi và quyết định Comment, Approve hay Request changes phù hợp. Có thể chỉ ghi trên giấy nếu không có người review riêng.
5. Để PR ở trạng thái mở cho người hướng dẫn xem. Ghi khi nào sẽ merge hoặc đóng; không xóa nhánh, không xóa lịch sử và không force push trong bài tập.

### Kết quả đúng

Bạn đối chiếu được từng thay đổi với issue, chỉ đúng chiều head vào base và giải thích quyết định bằng diff. Không có commit nào của bài tập đi vào nhánh chính hay repo thật.
