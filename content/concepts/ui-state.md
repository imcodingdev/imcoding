---
id: ui-state
title: Trạng thái giao diện (State)
group: frontend
prerequisites: [html-css-js, programming-values]
priority: 2
stage: 2
format: 2
signals:
  - "useState"
  - "useReducer"
  - "setIsOpen"
  - "'use client'"
  - "localStorage"
---

## Nhắc lại

### Trong ba lớp HTML, CSS, JavaScript, lớp nào quyết định "bấm nút thì chuyện gì xảy ra"?

JavaScript. HTML là khung và nội dung, CSS là phần trang trí, còn JavaScript là lớp hành động. Theo bài HTML, CSS và JavaScript, phần xử lý bấm nút phải thuộc ranh giới client: file có `'use client'` hoặc được import qua chuỗi module thuộc ranh giới đó.

### Biến (variable) là gì, và vì sao kiểu dữ liệu của biến lại quan trọng?

Biến là một cái tên gắn với một giá trị để code dùng lại, ví dụ `count = 3`. Kiểu dữ liệu cho biết giá trị đó là số, chữ, đúng/sai hay danh sách. Nhầm kiểu thì kết quả sai, ví dụ chữ `"3"` cộng `1` ra `"31"` chứ không ra `4`.

## Đoán trước

Bạn nhờ AI làm trang quản lý đơn cho quán cà phê. Mỗi đơn có nút "Đánh dấu đã thanh toán". Bạn bấm thử, dòng đơn đổi sang màu xanh và hiện chữ "Đã thanh toán". AI báo "tính năng đã xong". Bạn giao cho nhân viên dùng. Cuối ngày, nhân viên bấm F5 để tải lại trang và tất cả các đơn quay về "Chưa thanh toán". Sổ doanh thu trong ngày không khớp với tiền thật. Màn hình đã đổi màu đúng, vậy thông tin "đã thanh toán" thật ra được lưu ở đâu?

### Đáp án

Nó chỉ nằm trong **state**, tức phần trí nhớ tạm của giao diện, sống trong bộ nhớ của đúng tab trình duyệt đó. AI viết code đổi state khi bấm nút nhưng không gửi yêu cầu nào lên máy chủ để ghi vào database. Tải lại trang, đóng tab, hoặc mở trên máy khác thì trí nhớ tạm bị xóa và giao diện dựng lại từ dữ liệu gốc. Bài học: màn hình đổi đúng chưa chứng minh dữ liệu đã được lưu. Cách thử nhanh nhất là bấm xong rồi tải lại trang.

## Ví dụ mẫu

Hãy nghĩ tới tấm bảng trắng treo ở quầy pha chế. Nhân viên ghi "Bàn 5: 2 cà phê sữa", pha xong thì xóa. Bảng trắng giúp cả quầy nhìn là biết việc đang dở. Nhưng nó không phải sổ kế toán: hết ca lau bảng là mất hết.

**State (trạng thái giao diện)** là tấm bảng trắng đó của một component: những giá trị giao diện cần nhớ **trong lúc người dùng đang thao tác**. Ví dụ: hộp thoại đang mở hay đóng, ô tìm kiếm đang gõ chữ gì, giỏ hàng có mấy món, tab nào đang được chọn. Trong React, state được khai báo bằng `useState`. Điểm quan trọng: khi state đổi, React **vẽ lại** phần giao diện dùng nó. Biến thường thì không có khả năng này.

Cách làm SAI (AI dùng biến thường để nhớ số món):

```tsx
'use client'

export default function CartButton() {
  let count = 0 // SAI: biến thường, React không biết nó vừa đổi
  return (
    <button onClick={() => { count = count + 1 }}>
      Giỏ hàng: {count}
    </button>
  )
}
```

Bấm bao nhiêu lần màn hình vẫn hiện `Giỏ hàng: 0`. Giá trị có đổi trong bộ nhớ, nhưng không ai báo cho React vẽ lại.

Cách làm ĐÚNG:

```tsx
'use client'
import { useState } from 'react'

export default function CartButton() {
  // count: giá trị hiện tại. setCount: cách DUY NHẤT để đổi nó.
  const [count, setCount] = useState(0)
  // Lưu ý: người dùng bấm F5 thì count quay về ___
  return (
    <button onClick={() => setCount(count + 1)}>
      Giỏ hàng: {count}
    </button>
  )
}
```

Ba điều cần nhớ khi đọc code AI viết:

1. **State sống ở trình duyệt.** File dùng `useState` phải có `'use client'`. Mỗi người dùng, mỗi tab có một bản state riêng.
2. **State là tạm.** Thứ gì cần còn lại sau khi tải lại trang (đơn hàng, trạng thái thanh toán, hồ sơ) phải được gửi lên máy chủ và ghi vào database.
3. **Chỉ đổi state bằng hàm `set...`.** Với danh sách, code đúng tạo danh sách mới như `setItems([...items, newItem])`. Sửa thẳng kiểu `items.push(newItem)` thường khiến màn hình không cập nhật.

## Tìm trong project của bạn

1. **Tìm nơi khai báo state:** Mở tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`), tìm `useState(`. Mỗi kết quả là một thứ giao diện đang nhớ tạm. Đọc tên biến để đoán nó nhớ gì: `isOpen`, `isLoading`, `items`, `selectedId`.
2. **Phân loại từng state:** Với mỗi state, tự hỏi "tải lại trang mà mất cái này thì có sao không?". Hộp thoại đang mở, chữ đang gõ: mất không sao, đó là state đúng nghĩa. Đơn hàng, điểm thưởng, trạng thái đã duyệt: mất là sự cố.
3. **Kiểm tra đường lưu của dữ liệu quan trọng:** Với state thuộc loại "mất là sự cố", tìm trong cùng file xem gần chỗ gọi `set...` có lệnh gửi lên máy chủ không. Từ khóa: `fetch(`, `supabase.from(`, hoặc tên một hàm trong file có `'use server'`. Thấy có là ổn. Chỉ thấy `set...` mà không có lệnh gửi nào là có vấn đề.
4. **Tìm kiểu sửa thẳng state:** Tìm `.push(`, `.splice(`, `.sort(` trong các file có `useState`. Nếu chúng tác động thẳng lên biến state (không phải lên một bản sao) thì ghi lại để hỏi AI.
5. **Thử bằng tay:** Mở app, làm một thao tác quan trọng (thêm món, đổi trạng thái), rồi bấm F5. Sau đó mở thêm một tab ẩn danh và đăng nhập lại để xem.
6. **Ghi lại kết quả của bạn:**
   - Số chỗ dùng `useState` trong dự án: `[ ... ]`
   - State nào chứa dữ liệu "mất là sự cố" mà chưa thấy lệnh lưu lên máy chủ?: `[ Tên state, tên file: ... ]`
   - Sau khi F5, thao tác quan trọng có còn không?: `[ Còn / Mất ]`

## Tự giải thích

### Vì sao đổi giá trị của một biến thường thì màn hình không đổi, còn gọi `setCount` thì có?

React chỉ vẽ lại component khi được báo rằng state đã đổi, và lời báo đó chính là lệnh gọi hàm `set...`. Biến thường đổi trong im lặng nên React không biết. Thêm nữa, mỗi lần vẽ lại, component chạy lại từ đầu và biến thường bị gán lại giá trị ban đầu, còn state thì được React giữ hộ giữa các lần vẽ.

### Nếu bỏ hết database và chỉ dùng state để giữ danh sách đơn hàng thì chuyện gì xảy ra?

Mỗi tab có một danh sách riêng và không ai thấy đơn của ai. Nhân viên thu ngân thêm đơn, màn hình bếp không hiện. Tải lại trang là mất sạch. State chỉ phục vụ một người trong một phiên thao tác. Dữ liệu cần dùng chung hoặc cần còn lại sau này phải nằm ở database trên máy chủ.

### Vì sao lưu vào `localStorage` không thay được việc lưu vào database?

`localStorage` là ngăn chứa nhỏ của trình duyệt trên đúng một thiết bị. Nó còn lại sau khi tải lại trang nên dễ tạo cảm giác "đã lưu". Nhưng đổi máy, đổi trình duyệt hoặc xóa dữ liệu duyệt web là mất. Người dùng cũng tự mở DevTools sửa được nội dung trong đó, nên không được để ở đó thứ gì mà máy chủ cần tin, ví dụ quyền quản trị hay số dư.

## Trắc nghiệm

### AI viết đoạn này cho nút "Thêm ghi chú". Bấm nút xong, danh sách trên màn hình không thêm dòng nào. Nguyên nhân hợp lý nhất?

```tsx
const [notes, setNotes] = useState<string[]>([])

function addNote(text: string) {
  notes.push(text)
}
```

- [ ] Thiếu database nên không lưu được ghi chú
- [ ] `useState` không dùng được với danh sách
- [x] Code sửa thẳng vào `notes` mà không gọi `setNotes`, nên React không vẽ lại
- [ ] Trình duyệt chặn vì ghi chú có thể chứa dữ liệu cá nhân

**Giải thích:** React chỉ vẽ lại khi hàm `set...` được gọi với một giá trị mới. `notes.push` thay đổi âm thầm nên màn hình đứng yên. Database không liên quan ở đây: kể cả không lưu lên máy chủ, gọi `setNotes([...notes, text])` thì màn hình vẫn phải hiện dòng mới.

### Bạn bấm "Duyệt đơn", màn hình hiện chữ "Đã duyệt". Cách nào chứng minh tốt nhất rằng việc duyệt đã được lưu thật?

- [x] Tải lại trang hoặc mở trên thiết bị khác và thấy đơn vẫn ở trạng thái "Đã duyệt"
- [ ] Thấy chữ "Đã duyệt" hiện ra ngay sau khi bấm
- [ ] AI trả lời rằng nó đã kiểm tra và tính năng hoạt động
- [ ] Không thấy dòng lỗi đỏ nào trên màn hình

**Giải thích:** Chữ hiện ngay sau khi bấm chỉ chứng minh state đã đổi. Tải lại trang buộc giao diện dựng lại từ dữ liệu trên máy chủ, nên đó mới là phép thử cho việc lưu. Không có lỗi đỏ cũng không nói lên gì, vì một tính năng thiếu hẳn bước lưu thì không có gì để báo lỗi.

### Dự án báo lỗi khi build: `useState` chỉ dùng được trong Client Component. AI đề nghị thêm `'use client'` vào đầu file. Điều này có nghĩa gì?

- [ ] File đó sẽ không còn được gửi xuống trình duyệt nữa
- [x] Code của component đó được gửi xuống trình duyệt, nên không được đặt khóa bí mật hay truy vấn database trực tiếp trong file đó
- [ ] State của component sẽ được tự động lưu vào database
- [ ] Mọi người dùng sẽ dùng chung một state

**Giải thích:** `'use client'` đưa code của file xuống trình duyệt để xử lý tương tác. Sửa như vậy thường đúng, nhưng bạn cần nhìn lại xem file đó có đang chứa thứ chỉ nên ở máy chủ không. State vẫn là tạm và vẫn riêng cho từng tab.

### Trang quản trị có đoạn code dưới đây. Rủi ro là gì?

```tsx
const [isAdmin, setIsAdmin] = useState(false)

useEffect(() => {
  setIsAdmin(localStorage.getItem('role') === 'admin')
}, [])
```

- [ ] Không có rủi ro vì `localStorage` chỉ đọc được trên máy của chính người dùng
- [ ] `localStorage` chậm nên trang tải lâu hơn
- [ ] State kiểu đúng/sai không dùng được cho phân quyền
- [x] Người dùng tự sửa `role` trong trình duyệt được, nên giao diện quản trị sẽ hiện ra với bất kỳ ai

**Giải thích:** Chính vì nằm trên máy người dùng nên họ sửa được. State và `localStorage` chỉ nên quyết định việc hiển thị cho tiện. Quyền thật phải do máy chủ kiểm tra ở mỗi yêu cầu, dựa trên phiên đăng nhập.

## Kiểm tra không dùng AI

### Tình huống: Trang đặt bàn của bạn có bộ đếm "Còn 4 bàn trống". Khách bấm "Đặt bàn" thì số giảm còn 3 ngay lập tức. Tối thứ Bảy có 9 khách đặt thành công dù quán chỉ có 4 bàn. AI giải thích: "Số bàn trống được giữ trong state và trừ dần mỗi lần bấm." Hãy nêu vì sao thiết kế này gây ra sự cố và cần đổi gì.

#### Đáp án

1. **Nguyên nhân:** State nằm riêng trong từng tab trình duyệt. Chín khách mở chín trang, mỗi trang đều bắt đầu với "còn 4 bàn" và tự trừ trên bản riêng của mình. Không trang nào biết các trang khác đã đặt.
2. **Vì sao thử một mình không thấy lỗi:** Bạn thử trên một tab nên số giảm đúng. Lỗi chỉ lộ ra khi có nhiều người cùng dùng.
3. **Cần đổi gì:** Số bàn trống phải là dữ liệu trong database. Khi khách bấm đặt, máy chủ kiểm tra số bàn còn lại rồi mới ghi nhận, và từ chối nếu đã hết. Giao diện chỉ hiển thị con số máy chủ trả về.
4. **Cách kiểm chứng:** Mở hai trình duyệt khác nhau, đặt ở cái thứ nhất, tải lại cái thứ hai và xem con số có giảm theo không.

## Lỗi suy luận hay gặp

### "Màn hình hiện đúng rồi thì dữ liệu đã được lưu"

- **Vì sao sai:** Màn hình hiện theo state, mà state đổi ngay khi bấm, kể cả khi không có yêu cầu nào tới máy chủ hoặc yêu cầu đó thất bại.
- **Cách sửa:** Với mọi thao tác quan trọng, thử lại bằng cách tải lại trang. Khi nhờ AI làm tính năng, ghi rõ: "dữ liệu phải còn sau khi tải lại trang và hiện đúng trên thiết bị khác".

### "State là chỗ lưu dữ liệu của app"

- **Vì sao sai:** State là trí nhớ tạm của một tab. Nó không dùng chung giữa người dùng, không còn sau khi đóng trang.
- **Cách sửa:** Tách hai loại. Thứ chỉ phục vụ thao tác trước mắt thì để ở state. Thứ là sự thật của việc kinh doanh thì để ở database, giao diện chỉ đọc về để hiển thị.

### "Ẩn nút bằng state là người dùng không làm được việc đó"

- **Vì sao sai:** State chạy trên máy người dùng nên họ đổi được, hoặc bỏ qua giao diện và gửi yêu cầu thẳng tới máy chủ.
- **Cách sửa:** Coi việc ẩn hiện theo state là để giao diện gọn. Việc cho phép hay từ chối phải nằm ở code máy chủ.

## Bài tập thực hành

Mục tiêu: lập danh sách các state trong một màn hình quan trọng của bạn và xác nhận dữ liệu cần giữ đều có đường lưu lên máy chủ.

### Việc cần làm

1. Chọn một màn hình có thao tác quan trọng (tạo đơn, sửa hồ sơ, duyệt yêu cầu). Chạy app ở máy của bạn hoặc trên bản preview, dùng tài khoản thử.
2. Mở file của màn hình đó, tìm `useState(` và chép tên từng state vào một bảng hai cột: "mất không sao" và "mất là sự cố".
3. Với mỗi state ở cột "mất là sự cố", tìm lệnh gửi lên máy chủ đi kèm và ghi tên hàm hoặc đường dẫn API.
4. Trên giao diện, làm thao tác đó với dữ liệu thử rồi bấm F5.
5. Mở một trình duyệt khác, đăng nhập cùng tài khoản thử và xem dữ liệu có hiện đúng không.

### Kết quả đúng

Bảng của bạn không còn state nào ở cột "mất là sự cố" mà thiếu đường lưu. Sau khi F5 và sau khi mở trên trình duyệt khác, dữ liệu thử vẫn hiện đúng như lúc bạn vừa thao tác.

### Nhờ AI rà lại

```text
Hãy liệt kê mọi chỗ dùng useState trong thư mục app/ và components/.
Với mỗi state, cho biết: nó nhớ gì, và giá trị đó có được ghi lên
máy chủ hay database ở đâu không (nêu tên file và hàm).
Đánh dấu các state chứa dữ liệu nghiệp vụ mà không có bước lưu.
Chỉ báo cáo, không sửa file nào.
```
