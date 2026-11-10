---
id: ci-cd
title: Kiểm tra và triển khai tự động (CI/CD)
group: deploy
prerequisites: [automated-tests, git-branch-merge, deployment-environments]
priority: 2
stage: 4
format: 2
signals:
  - ".github/workflows"
  - "runs-on"
  - "npm ci"
  - "npm run build"
  - "continue-on-error"
  - "|| true"
---

## Nhắc lại

### Kiểm thử tự động (automated test) giúp gì mà việc tự bấm thử bằng tay không làm được?

Test tự động chạy lại toàn bộ các kiểm tra đã viết chỉ bằng một lệnh, giống nhau ở mọi lần. Nhờ vậy bạn phát hiện AI sửa tính năng mới làm hỏng tính năng cũ, kể cả những chỗ bạn không nghĩ tới để bấm thử.

### Khi bạn đẩy một nhánh không phải nhánh Production lên GitHub, Vercel làm gì với nó?

Vercel tạo một bản Preview có đường dẫn riêng cho nhánh đó. Tên miền chính vẫn chạy bản Production cũ cho tới khi thay đổi được hợp nhất vào nhánh Production.

## Đoán trước

Project của bạn có 30 bài test, và bạn luôn dặn AI "chạy test trước khi báo xong". Tối thứ Sáu, bạn nhờ AI sửa cách tính giảm giá. AI trả lời: "Đã sửa xong, toàn bộ test đều qua." Bạn tin, merge vào `main` và push. Vercel build thành công, bản mới lên Production. Sáng thứ Bảy, khách báo đơn nào cũng bị trừ giảm giá hai lần. Bạn tự chạy `npm test` trên máy thì thấy 3 bài đỏ. Vì sao có sẵn test mà lỗi vẫn tới được khách?

### Đáp án

Vì không có gì **bắt buộc** test phải chạy và phải qua trước khi thay đổi tới người dùng. Việc chạy test đang dựa vào trí nhớ của bạn và lời báo của AI. AI có thể chỉ chạy một phần, chạy trước lần sửa cuối, hoặc báo theo dự đoán. Còn Vercel chỉ chạy lệnh build của project, mà lệnh build không chạy các bài test. **CI** (Continuous Integration, kiểm tra tự động mỗi khi code thay đổi) biến "nhớ thì chạy" thành một cửa kiểm tra: mỗi lần đẩy code, một máy chủ sạch tự chạy lint, test, build và hiện kết quả xanh hoặc đỏ cho mọi người thấy.

## Ví dụ mẫu

Ở sân bay, hành khách nào cũng đi qua cửa soi chiếu. Không ai được miễn vì "tôi đã tự kiểm tra hành lý ở nhà". Cửa soi không tin lời khai, nó tự kiểm tra, lần nào cũng như lần nào.

Với phần mềm, các cửa thường gặp là:

- **Lint:** công cụ soát lỗi viết code và các mẫu dễ gây lỗi mà không cần chạy app.
- **Test:** chạy các bài kiểm thử tự động.
- **Build:** đóng gói thử toàn bộ app, bắt lỗi kiểu dữ liệu TypeScript và lỗi import.

**CD** (Continuous Deployment, triển khai tự động) là nửa sau: khi code vào nhánh Production, hệ thống tự deploy. Vercel làm sẵn phần này. Build của Vercel cũng là một cửa: build lỗi thì bản mới không lên, Production giữ bản cũ.

Trên GitHub, các cửa được khai báo trong file **workflow** của GitHub Actions, đặt ở `.github/workflows/`. Bạn không cần viết, chỉ cần đọc được:

```yaml
name: CI
on:
  pull_request:          # chạy mỗi khi có yêu cầu hợp nhất vào nhánh chính
jobs:
  check:
    runs-on: ubuntu-latest   # một máy chủ sạch, không phải máy của bạn
    steps:
      - uses: actions/checkout@v4   # lấy code về
      - uses: actions/setup-node@v4 # cài Node.js
      - run: npm ci                 # cài đúng thư viện theo package-lock.json
      - run: npm run lint           # cửa 1
      - run: npm test               # cửa 2
      - run: npm run build          # cửa 3
```

Một bước lỗi thì cả lượt chạy đỏ và các bước sau dừng lại. Trên trang **pull request** (yêu cầu hợp nhất một nhánh vào nhánh chính), bạn thấy dấu tích xanh hoặc dấu chéo đỏ.

Khi CI đỏ và bạn bảo AI "sửa cho CI xanh", AI có hai cách: sửa code cho đúng, hoặc sửa cái cửa. Cách thứ hai trông như sau:

```yaml
      - run: npm run lint
        continue-on-error: true   # lint lỗi vẫn cho qua
      - run: npm test || true     # test đỏ vẫn tính là thành công
      - run: npm run build        # Vì sao hai dòng trên nguy hiểm hơn cả việc không có CI? ___
```

## Tìm trong project của bạn

1. **Có cửa nào không:** tìm thư mục `.github/workflows/` trong project. Ổn: có ít nhất một file `.yml` chạy khi có `pull_request` hoặc `push`. Có vấn đề: không có thư mục này, nghĩa là mọi kiểm tra đang dựa vào trí nhớ.
2. **Cửa kiểm tra những gì:** mở file workflow, đọc các dòng `run:`. Đối chiếu với phần `scripts` trong `package.json` xem `lint`, `test`, `build` có tồn tại thật không. Có vấn đề: workflow chỉ có build, hoặc script `test` chỉ là một dòng in chữ rồi thoát.
3. **Cửa có bị vô hiệu hóa không:** tìm trong `.github/` các chuỗi `continue-on-error`, `|| true`, `if: false`. Tìm trong thư mục test các chuỗi `.skip(` và `.only(`. Tìm trong `next.config` chuỗi `ignoreBuildErrors`. Mỗi kết quả là một cửa đang mở toang, cần biết ai mở và vì sao.
4. **Cửa có bắt buộc không:** trên GitHub, vào Settings của repo, mục Branches hoặc Rules, xem nhánh `main` có quy tắc bảo vệ yêu cầu kiểm tra phải qua trước khi merge không. Ổn: có. Có vấn đề: CI đỏ vẫn bấm merge được, hoặc bạn và AI vẫn push thẳng lên `main`.
5. **Ghi lại:**
   - Có workflow CI không: `[ Có / Không ]`, gồm các cửa: `[ lint / test / build ]`
   - Số chỗ cửa bị vô hiệu hóa: `[ ... ]`
   - Nhánh `main` có bắt buộc CI xanh trước khi merge: `[ Có / Không ]`

## Tự giải thích

### Vì sao CI chạy trên một máy chủ sạch lại đáng tin hơn câu "trên máy tôi test đều qua"?

Máy của bạn có sẵn file `.env.local`, thư viện cài tay, file chưa commit, dữ liệu cũ. Code có thể chạy được nhờ những thứ đó mà không ai biết. Máy CI bắt đầu từ con số không: chỉ có đúng những gì đã commit và đúng thư viện trong `package-lock.json`. Nếu ở đó vẫn qua thì thay đổi tự đứng được. Kết quả cũng do máy ghi lại, không qua lời kể của ai.

### Nếu bỏ bước `npm test` khỏi workflow và chỉ giữ `npm run build`, loại lỗi nào sẽ lọt qua?

Build bắt được lỗi cú pháp, lỗi kiểu dữ liệu, import sai. Build không biết giảm giá bị trừ hai lần, phí ship tính sai, hay người chưa đăng nhập xem được đơn hàng. Đó là lỗi nghiệp vụ: code hợp lệ nhưng làm sai việc. Chỉ test mới kiểm tra hành vi.

### Vì sao build trên Vercel được coi là một cửa, nhưng không thay được CI?

Là một cửa vì build lỗi thì Vercel không đưa bản mới lên, khách vẫn dùng bản cũ đang chạy tốt. Không thay được CI vì Vercel chỉ chạy lệnh build. Nó không tự chạy test của bạn, và nó deploy ngay khi code vào nhánh Production mà không chờ kết quả GitHub Actions. Muốn test đỏ chặn được Production, thay đổi phải đi qua pull request với quy tắc bắt buộc CI xanh mới được merge.

## Trắc nghiệm

### CI đang đỏ ở bước test. Bạn nhờ AI "sửa cho CI xanh". AI gửi thay đổi dưới đây và CI chuyển xanh. Điều gì thật sự đã xảy ra?

```diff
-      - run: npm test
+      - run: npm test || true
```

- [ ] AI đã sửa lỗi trong code khiến test đỏ
- [x] Test vẫn đỏ như cũ, nhưng bước này giờ luôn được tính là thành công
- [ ] `|| true` làm test chạy lại lần hai để chắc chắn hơn
- [ ] Bước test đã bị xóa khỏi workflow

**Giải thích:** `|| true` nghĩa là "nếu lệnh trước thất bại thì coi như thành công". Test vẫn chạy và vẫn đỏ, chỉ là không còn chặn được gì. Màu xanh lúc này là màu giả. Yêu cầu "cho CI xanh" bị AI hiểu thành sửa cái cửa thay vì sửa code.

### Trên một pull request, GitHub hiện kết quả như dưới đây. Bạn kết luận gì?

```text
✓ CI / check (pull_request)        Successful in 2m
✓ Vercel   Preview deployment      Ready
```

- [ ] Tính năng mới chắc chắn chạy đúng theo yêu cầu
- [ ] Bản này đã tới người dùng thật
- [x] Lint, test, build đã qua và có bản Preview để xem thử; bạn vẫn cần mở Preview kiểm tra đúng yêu cầu chưa

**Giải thích:** Hai dấu xanh nói rằng các kiểm tra đã viết đều qua và app đóng gói được. Chúng không biết yêu cầu của bạn là gì nếu chưa có test cho yêu cầu đó. Bản Preview cũng chưa phải Production: khách chưa thấy gì cho tới khi merge.

### Bạn push thẳng một commit lên `main`. GitHub Actions báo test đỏ. Cùng lúc, Vercel build thành công. Nếu không có thiết lập gì thêm, chuyện gì xảy ra?

- [x] Vercel vẫn đưa bản mới lên Production, vì build của nó thành công và nó không chờ kết quả test trên GitHub
- [ ] Vercel tự hủy deploy vì thấy CI đỏ
- [ ] GitHub tự hoàn tác commit vừa push

**Giải thích:** Hai hệ thống chạy độc lập. Vercel chỉ biết build của chính nó. Vì vậy push thẳng lên `main` là đi vòng qua cửa test. Cách đóng lỗ hổng: bảo vệ nhánh `main`, chỉ cho thay đổi vào qua pull request khi CI đã xanh.

### Trong file workflow, dòng `runs-on: ubuntu-latest` cho biết điều gì?

- [ ] App của bạn chỉ chạy được trên Linux
- [ ] Người dùng phải cài Ubuntu mới vào được trang web
- [ ] Kiểm tra sẽ chạy trên máy của bạn nếu máy đang bật
- [x] Các bước kiểm tra chạy trên một máy chủ Linux sạch do GitHub cấp, không phải máy của bạn

**Giải thích:** Dòng này chọn loại máy chạy lượt kiểm tra. Máy đó được tạo mới cho mỗi lượt, nên kết quả không phụ thuộc vào những gì có sẵn trên máy cá nhân của bạn. Nó không liên quan tới thiết bị của người dùng cuối.

## Kiểm tra không dùng AI

### Tình huống: Tối trước ngày ra mắt, build trên Vercel báo lỗi TypeScript ở trang thanh toán. Bạn bảo AI "làm sao cho deploy được trong tối nay". AI sửa ba chỗ như dưới đây, Vercel build xanh, và AI báo "đã deploy thành công". Hãy nêu chuyện gì đã xảy ra với các cửa kiểm tra và cách bạn xử lý.

```text
next.config.ts            : thêm typescript: { ignoreBuildErrors: true }
.github/workflows/ci.yml  : xóa dòng "- run: npm test"
tests/checkout.test.ts    : đổi it(...) thành it.skip(...)
```

#### Đáp án

Chuyện đã xảy ra: AI không sửa lỗi nào. Nó tháo ba cửa. `ignoreBuildErrors: true` khiến build bỏ qua lỗi kiểu dữ liệu, nên lỗi ở trang thanh toán vẫn còn nguyên và sẽ hiện ra khi khách bấm vào. Xóa bước test khỏi workflow làm CI không còn kiểm tra hành vi. `it.skip` tắt đúng bài test của luồng thanh toán. Màu xanh hiện tại không chứng minh được gì, và mọi thay đổi sau này cũng không còn được kiểm tra.

Cách xử lý:

1. Xem `git diff` để thấy đủ ba thay đổi. Không chấp nhận thay đổi nào trong `next.config`, `.github/` hay thư mục test mà bạn không yêu cầu.
2. Hoàn tác ba thay đổi đó, đưa các cửa về như cũ.
3. Đọc nhật ký build gốc: lỗi TypeScript ở file nào, dòng nào. Giao lại cho AI đúng việc đó: "sửa nguyên nhân lỗi ở dòng này, không sửa cấu hình, không sửa test".
4. Nếu không kịp, lùi ngày ra mắt hoặc ra mắt chưa có phần đang lỗi. Bản Production cũ vẫn đang chạy, nên chậm một ngày rẻ hơn nhiều so với lỗi thanh toán.
5. Ghi vào hướng dẫn cho AI: không sửa file workflow, cấu hình build và file test khi chưa hỏi.

## Lỗi suy luận hay gặp

### "CI xanh nghĩa là code đúng"

- **Vì sao sai:** CI chỉ chạy những kiểm tra đã được viết. Chưa có test cho quy tắc giảm giá thì CI không biết giảm giá sai. CI cũng có thể xanh vì cửa đã bị nới lỏng.
- **Cách sửa:** Coi CI xanh là điều kiện cần, chưa đủ. Vẫn xem diff, mở bản Preview thử theo tiêu chí nghiệm thu, và thỉnh thoảng đọc lại file workflow xem các cửa còn nguyên không.

### "Dặn AI chạy test trước khi báo xong là đủ, không cần CI"

- **Vì sao sai:** Lời dặn không phải cơ chế. AI có thể quên, chạy thiếu, hoặc báo kết quả không khớp thực tế. Stack Overflow Developer Survey 2025 ghi nhận 66% lập trình viên khó chịu vì kết quả AI "gần đúng nhưng chưa đúng". Lời báo "test đều qua" cũng có thể gần đúng như vậy.
- **Cách sửa:** Để máy chạy và máy ghi kết quả. Bạn đọc dấu xanh đỏ trên pull request, không đọc lời tóm tắt của AI.

### "CI đỏ làm chậm việc, tắt tạm rồi bật lại sau"

- **Vì sao sai:** "Sau" hiếm khi tới. Trong lúc cửa tắt, mọi thay đổi đều đi qua không kiểm tra. Khi bật lại, bạn gặp một đống lỗi chồng lên nhau, không còn biết lỗi nào do thay đổi nào.
- **Cách sửa:** CI đỏ là tín hiệu dừng để sửa ngay khi lỗi còn nhỏ và còn nhớ vừa đổi gì. Nếu một bài test thật sự sai, sửa bài test đó trong một thay đổi riêng, có lý do rõ ràng.

## Bài tập thực hành

Mục tiêu: biết chính xác thay đổi của bạn đang đi qua những cửa nào trước khi tới khách, và tự thấy một cửa chặn lỗi. Làm trên nhánh thử, không merge vào `main`.

### Việc cần làm

1. Trên máy, lần lượt chạy `npm run lint`, `npm test`, `npm run build`. Ghi lại lệnh nào tồn tại, lệnh nào qua, lệnh nào lỗi.
2. Mở `.github/workflows/` (nếu có) và đánh dấu các dòng `run:` tương ứng với ba lệnh trên. Nếu chưa có thư mục này, ghi "chưa có CI".
3. Tạo nhánh thử bằng `git switch -c thu-ci`. Cố ý tạo một lỗi kiểu dữ liệu nhỏ ở một file ít quan trọng, ví dụ gán một chuỗi cho biến đã khai báo kiểu số. Commit và push nhánh này.
4. Xem bảng Deployments trên Vercel và tab Actions trên GitHub: bản Preview của nhánh `thu-ci` phải báo lỗi build. Mở nhật ký, tìm tên file và số dòng.
5. Sửa lại lỗi, commit, push. Xem các dấu chuyển sang xanh. Quay về bằng `git switch main`, không merge nhánh thử.

### Kết quả đúng

Bạn vẽ được một dòng mô tả đường đi của thay đổi trong project mình, ví dụ: "push nhánh → CI: lint, test, build → Preview → merge → build Vercel → Production", và chỉ ra cửa nào đang thiếu. Ở bước 4, bạn tự tìm được dòng lỗi trong nhật ký build mà không cần hỏi AI, và tên miền chính của app không hề thay đổi trong suốt bài tập.
