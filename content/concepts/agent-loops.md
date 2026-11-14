---
id: agent-loops
title: Cho agent tự chạy vòng lặp an toàn
group: ai-git
prerequisites: [agent-handoff, done-evidence, logging-monitoring, ai-cost-limits]
priority: 2
stage: 4
format: 2
signals: ["vòng lặp", "max iterations", "retry", "budget", "nhật ký agent"]
sources:
  - title: Learn Harness Engineering — Lecture 11
    url: https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-11-why-observability-belongs-inside-the-harness/index.md
  - title: Learn Harness Engineering — Lecture 13
    url: https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-13-loop-engineering/index.md
---

## Nhắc lại

### Bàn giao tốt cần giữ gì để phiên sau không thử lại từ đầu?

Trạng thái code, việc đã kiểm, lỗi còn lại, lý do quyết định và bước tiếp. Nhật ký vòng lặp cũng cần các thông tin này để lần thử sau biết điều gì đã thất bại.

### Khi agent nói “đã xong”, bạn cần bằng chứng gì và giới hạn chi phí ở đâu?

Cần kết quả kiểm đúng tiêu chí, gắn với code hiện tại. Ngân sách phải có nơi theo dõi và cơ chế dừng phù hợp; chỉ ghi một con số trong prompt không tự tạo khóa chi tiêu.

## Đoán trước

Bạn giao “sửa lỗi tìm kiếm, cứ thử tới khi test xanh” rồi đi họp. Lúc về, agent đã đổi nhiều file nhưng test vẫn báo không khởi động được môi trường. Các lần sau chỉ đổi cách viết hàm, chưa lần nào xử lý được nguyên nhân khiến test không chạy. Bạn mất thời gian và lượt gọi mà vẫn không có kết quả để nghiệm thu. Vòng lặp thiếu những điều kiện nào?

### Đáp án

Thiếu giới hạn số lần, ngân sách, điều kiện dừng khi lỗi lặp lại và nhật ký đủ rõ để nhận ra không có tiến triển. Nó cũng thiếu phân biệt lỗi code với môi trường kiểm bị chặn. Một vòng lặp an toàn phải quan sát kết quả sau mỗi lần, rồi quyết định tiếp hay dừng. “Cứ thử tiếp” không phải kế hoạch xử lý lỗi.

## Ví dụ mẫu

**Vòng lặp agent** là chuỗi đọc trạng thái, làm một thay đổi, kiểm, ghi kết quả rồi quyết định bước tiếp theo. Nó giảm việc bạn phải nhắn “thử lại”, nhưng bạn vẫn chịu trách nhiệm đặt mục tiêu, giới hạn và nghiệm thu. Không cần học một lệnh riêng của công cụ để hiểu hoặc kiểm thiết kế này.

Có hai lý do dừng khác nhau. **Dừng vì đạt** nghĩa là các tiêu chí đã có bằng chứng. **Dừng vì giới hạn hoặc bị chặn** nghĩa là hết lượt, hết ngân sách, lỗi lặp lại hoặc thiếu quyền; việc vẫn chưa hoàn thành. Báo cáo cuối phải phân biệt hai lý do, không biến “hết thời gian” thành “đã xong”.

Đây là bản giao việc minh họa, không phải cấu hình có thể chạy. Các con số là mức giả định cho một lần thử nhỏ; chúng không phải mặc định của công cụ:

```text
Mục tiêu: bộ lọc danh sách giả xử lý đúng đầu vào rỗng.
Phạm vi: hàm lọc và test liên quan trên nhánh thử.
Mỗi vòng: một giả thuyết -> sửa -> kiểm -> ghi kết quả.
Tối đa 3 vòng; trần chi phí 1 USD cho lần thử giả định.
Kiểm ngân sách trước và sau mỗi vòng; thiếu số đo thì dừng.
Dừng đạt: tiêu chí đầu vào rỗng và bình thường đều qua kiểm.
Dừng chặn: cùng lỗi lặp lại sau một lần thử sửa có căn cứ.
Dừng ngay nếu cần quyền mới hoặc tài nguyên ngoài phạm vi.
Không bỏ test, nới tiêu chí, deploy hoặc dùng dữ liệu thật.
Cuối cùng: bàn giao diff, kết quả, chi phí và lý do dừng.
```

Nhật ký minh họa cho thấy dừng sớm dù chưa hết số vòng:

```text
Vòng 1 | lỗi: bộ kiểm không khởi động | chưa có kết quả chức năng
Giả thuyết: lệnh chọn sai thư mục test
Vòng 2 | đã dùng lệnh trong tài liệu | vẫn lỗi khởi động như cũ
Kết luận: bị chặn, không sửa tiếp hàm lọc
Bàn giao: lệnh, lỗi đã che dữ liệu riêng, thay đổi đã thử
Chờ: người phụ trách xác nhận môi trường kiểm
```

Để biết vòng lặp đang làm gì, cần hai loại thông tin. Nhật ký chạy cho thấy lệnh nào thực thi, lỗi gì, thay đổi nào và chi phí ra sao. Tiêu chí cùng phạm vi cho thấy vì sao kết quả được chấp nhận. Một log dài không có tiêu chí vẫn không trả lời được “đã đúng việc chưa?”.

Trần ghi bằng lời cần được hỗ trợ bằng cơ chế giới hạn thực tế của môi trường chạy hoặc người giám sát. Kiểm chi phí sau mỗi vòng vẫn có thể phát hiện quá muộn nếu một vòng quá đắt. Trước khi chạy tự động, xác nhận cách chặn chi tiêu, giới hạn thời gian mỗi lần và cách dừng tiến trình. Nếu chưa có khả năng đó, chỉ chạy từng vòng có người theo dõi, không để chạy không giám sát.

## Tìm trong project của bạn

1. Tìm yêu cầu hoặc tài liệu có các cụm “cứ thử”, “retry”, “đến khi xong”. Ghi mục tiêu cụ thể và điều kiện dừng hiện tại: `[đạt khi ... / dừng chặn khi ...]`.
2. Đọc phạm vi quyền: agent được sửa file nào, gọi dịch vụ nào, có được deploy không? Ghi phần chưa rõ. Việc chỉ cần dữ liệu giả không nên có quyền ghi vào hệ thống thật.
3. Tìm nơi lưu số vòng, thời gian và chi phí. Ghi `[nguồn số đo, ai theo dõi, cơ chế chặn]`. Nếu chỉ có câu dặn trong prompt, đánh dấu chưa có giới hạn được thực thi.
4. Đọc nhật ký hai lần thử gần nhau bằng dữ liệu đã che thông tin riêng. Ghi `[lỗi, giả thuyết sửa, kết quả]`. Nếu lỗi giống hệt và không có thông tin mới, đó là dấu hiệu nên dừng điều tra thay vì tiếp tục sinh code.
5. Tìm bằng chứng người hoặc bước kiểm độc lập xem kết quả. Ghi `[tiêu chí, test, diff, phần chưa kiểm]`. Lời tự nhận xét của agent không được dùng làm điều kiện duy nhất cho vòng tiếp.

Bạn cần biết ai có thể dừng lần chạy đang hoạt động và ai quyết định cho chạy lại. Không phải tạo một bộ điều phối lớn; chỉ cần quy tắc đủ rõ và công cụ thực sự hỗ trợ. Nếu chưa trả lời được, hãy giữ chế độ từng vòng có giám sát.

## Tự giải thích

### Vì sao có giới hạn số vòng rồi vẫn cần giới hạn chi phí?

Mỗi vòng có thể gọi công cụ khác nhau và xử lý lượng nội dung khác nhau. Một vòng dài vẫn có thể tốn hơn dự kiến. Giới hạn lượt ngăn thử vô tận; giới hạn chi phí và thời gian bảo vệ tài nguyên. Chúng giải quyết các rủi ro liên quan nhưng không thay thế nhau.

### Vì sao lặp lại cùng lỗi là lý do dừng dù còn ngân sách?

Lặp lại mà không có thông tin mới cho thấy giả thuyết sửa chưa chạm nguyên nhân hoặc môi trường chưa sẵn sàng. Dừng để ghi lỗi và nhờ quyết định đúng giúp tránh sửa lan. Ngân sách còn không phải bằng chứng rằng lần tiếp sẽ có ích.

### Nếu agent tự viết test rồi tự báo test đạt thì cần kiểm thêm gì?

Đối chiếu test với tiêu chí đã chốt, đọc diff xem có nới điều kiện và kiểm hành vi thực tế phù hợp. Một người hoặc phiên kiểm độc lập có thể giúp tìm điểm bỏ sót, nhưng kết luận vẫn phải dựa vào bằng chứng, không phải hai lời đồng ý.

## Trắc nghiệm

### Agent báo “đã dùng hết ba vòng, nhiệm vụ hoàn thành”, nhưng log còn lỗi. Kết luận nào đúng?

- [ ] Hoàn thành vì đã chạy đủ số lần được giao
- [ ] Chạy thêm tự động cho tới khi hết lỗi
- [x] Đã dừng do giới hạn, nhiệm vụ chưa đạt; cần bàn giao kết quả và lỗi

**Giải thích:** Giới hạn là phanh, không phải tiêu chí thành công. Tự chạy thêm vượt điều kiện đã giao; phải giữ rõ lý do dừng và việc còn mở.

### Nhật ký có hai dòng này. Nên làm gì tiếp?

```text
Vòng 1: test không khởi động; agent sửa hàm sắp xếp.
Vòng 2: cùng lỗi khởi động; chưa test nào chạy.
```

- [x] Dừng sửa chức năng, ghi chặn và kiểm nguyên nhân môi trường trong phạm vi được phép
- [ ] Thử một cách sắp xếp khác cho tới khi lỗi biến mất
- [ ] Đánh dấu đạt vì không test nào báo sai chức năng

**Giải thích:** Chưa chạy test thì chưa có bằng chứng về hàm. Sửa thuật toán không có căn cứ từ lỗi khởi động và có thể làm phạm vi phình ra.

### Bạn đặt trần chi phí trong prompt nhưng không có số đo hoặc cơ chế chặn. Có nên để chạy qua đêm?

- [ ] Có, agent luôn nhớ trần đã ghi
- [x] Chưa; cần giới hạn thực thi và quan sát được, nếu thiếu thì theo dõi từng vòng
- [ ] Có, miễn chỉ cho ba vòng

**Giải thích:** Văn bản không tạo khóa chi tiêu, còn số vòng không giới hạn giá của một vòng. Thiếu quan sát thì bạn không biết giới hạn đã được giữ hay chưa.

### Vòng lặp làm test xanh bằng cách đổi kỳ vọng từ “từ chối” sang “chấp nhận”. Điều gì cần kiểm?

- [ ] Chỉ xem tổng số test xanh tăng hay giảm
- [ ] Chỉ hỏi agent có tự tin không
- [x] Đối chiếu diff với tiêu chí gốc; không chấp nhận việc tự nới tiêu chí để đạt

**Giải thích:** Bộ kiểm có thể đã đổi nghĩa, nên màu xanh không còn bảo vệ yêu cầu cũ. Cần kiểm cả sản phẩm lẫn điều kiện được dùng để chấm sản phẩm.

## Kiểm tra không dùng AI

### Bạn định cho agent tự sửa lỗi nhãn trùng trong danh mục sản phẩm giả. Nó được phép thay hàm lọc và test, nhưng vòng đầu đề xuất kết nối kho hàng thật để “đủ dữ liệu hơn”. Hãy nêu quyết định, lý do và thông tin cần bàn giao.

#### Đáp án

Dừng vì đề xuất vượt phạm vi và cần tài nguyên thật, dù còn lượt và ngân sách. Ghi lỗi nhãn trùng, bộ dữ liệu giả đã dùng, giả thuyết đang xét, lệnh kiểm cùng kết quả, diff và chi phí hiện biết. Người phụ trách xem liệu bộ giả có thiếu trường hợp nào và bổ sung dữ liệu giả phù hợp nếu cần. Không tự cấp quyền kho hàng thật để vòng lặp tiếp tục. Chỉ chạy lại khi phạm vi và cách kiểm được xác nhận rõ.

## Lỗi suy luận hay gặp

### “Tự động nghĩa là tôi không cần đọc kết quả nữa”

Vòng lặp tạo thay đổi nhanh hơn, nên phần bạn chưa hiểu cũng có thể tăng nhanh. Đặt thời điểm đọc diff và bằng chứng, bắt đầu từ việc nhỏ. Đừng để số lượng kết quả vượt khả năng nghiệm thu của mình.

### “Càng nhiều log càng dễ kiểm soát”

Log chỉ hữu ích khi nối được vòng, mục tiêu, lệnh, kết quả và quyết định tiếp theo. Tránh ghi dữ liệu khách, khóa hoặc toàn bộ request nhạy cảm. Một ghi chú ngắn có đường dẫn bằng chứng thường dễ rà hơn bản đổ dữ liệu không chọn lọc.

### “Agent còn thử được thì chưa nên dừng”

Khả năng sinh thêm cách sửa không chứng minh có tiến bộ. Dừng khi lỗi lặp, quyền thiếu hoặc giới hạn chạm tới; lưu bàn giao để lần sau bắt đầu từ hiểu biết đã có. Dừng đúng lúc là một kết quả vận hành hợp lệ, không phải bằng chứng chức năng đã xong.

## Bài tập thực hành

Mục tiêu: kiểm thiết kế vòng lặp bằng mô phỏng trên giấy hoặc tài liệu nháp. Không bật lịch tự chạy, không gọi API tính phí và không thao tác dữ liệu thật.

### Việc cần làm

1. Chọn một lỗi nhỏ trên dữ liệu giả, viết tiêu chí đạt và tập file được phép sửa.
2. Đặt số vòng, ngân sách giả định, cách theo dõi và điều kiện dừng vì chặn; ghi rõ đây chưa phải cơ chế chặn đang hoạt động.
3. Tạo hai dòng nhật ký giả: một lần kiểm thất bại và một lần gặp lại đúng lỗi đó.
4. Áp dụng quy tắc để quyết định dừng, viết bàn giao gồm lỗi, thay đổi đã thử, kết quả và điều kiện chạy lại.
5. Tạo tình huống giả khác đã qua đủ kiểm, xác nhận báo cáo phân biệt được dừng đạt với dừng bị chặn.

### Kết quả đúng

Bản thiết kế có mục tiêu, phạm vi, kiểm sau mỗi vòng, giới hạn và nơi lưu trạng thái. Bạn giải thích được vì sao mô phỏng lỗi lặp phải dừng, chỉ ra cơ chế kiểm soát còn cần có trước khi tự động hóa, và không nhầm việc dừng với việc hoàn thành.
