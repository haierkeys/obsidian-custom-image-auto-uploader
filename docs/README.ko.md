[中文文档](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/readme-zh.md) / [English Document](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/README.md) / [日本語](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.ja.md) / [한국어](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.ko.md) / [繁體中文](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.zh-TW.md)



<h1 align="center">Obsidian Custom Image Auto Uploader</h1>

<p align="center">
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/releases"><img src="https://img.shields.io/github/release/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="release"></a>
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/LICENSE"><img src="https://img.shields.io/github/license/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="license"></a>
</p>

<p align="center">
  <strong>Obsidian 노트 이미지 일괄 클라우드 동기화 및 처리 플러그인</strong>
  <br>
  <em>일괄 다운로드 / 업로드 / 자르기 / 압축 / 다중 이미지 호스트 지원</em>
</p>

<p align="center">
PC와 모바일 기기에서 노트의 이미지를 일괄 다운로드하고, 원격 서버, 가정용 NAS, WebDAV 또는 클라우드 스토리지(Aliyun OSS, Amazon S3, Cloudflare R2, MinIO)에 일괄 업로드하여 저장할 수 있으며, 이미지 늘리기, 자르기 및 크기 수정도 가능합니다.
</p>

<div align="center">
    <img src="https://github.com/user-attachments/assets/0878061b-d77c-48c5-aa61-cc5154612a7b" alt="preview" width="800" />
</div>

---

## ✨ 핵심 기능

* **⬇️ 일괄 다운로드**: 노트 내의 웹 이미지를 클릭 한 번으로 로컬로 다운로드합니다.
* **⬇️ 다중 노트 일괄 다운로드**: 노트 저장소의 모든 노트에 있는 이미지를 한 번에 다운로드할 수 있습니다.
* **☁️ 일괄 업로드**: 로컬 이미지를 원격 서비스로 업로드하며 다양한 스토리지 백엔드를 지원합니다:
    * **자체 구축 서비스**: [Custom Image Gateway](https://github.com/haierkeys/custom-image-gateway)와 함께 사용합니다.
    * **클라우드 스토리지**: Aliyun OSS, Amazon S3, Cloudflare R2, MinIO 등.
    * **범용 프로토콜**: WebDAV, 원격 서버, 가정용 NAS.
* **☁️ 다중 노트 일괄 업로드**: 노트 저장소의 모든 노트에 있는 이미지를 한 번에 업로드할 수 있습니다.
* **✂️ 이미지 처리**: 노트 속성 또는 본문에서 즉석으로 이미지를 처리할 수 있습니다(예: 블로그 커버 이미지):
    * 등배 고정 좌상단 채우기 (Cover)
    * 등배 고정 중앙 채우기 (Contain)
    * 고정 크기 늘리기 (Stretch)
    * 등배 맞춤 (Fit)
* **📱 모든 플랫폼 지원**: Windows, MacOS, Linux, Android, iOS.
* **🖱️ 편리한 조작**: 드래그 앤 드롭, 붙여넣기 자동 업로드를 지원합니다.
* **🌍 다국어 지원**: 내장된 다국어 팩을 지원합니다.
* **🗑️ 연결되지 않은 이미지 정리**: 노트에 연결되지 않은 로컬 이미지를 노트 저장소에서 한 번에 정리할 수 있습니다.

## 🗺️ 로드맵 (Roadmap)

우리는 지속적으로 개선하고 있으며, 다음은 향후 개발 계획입니다:

- [x] **연결되지 않은 이미지 정리**: 노트에 연결되지 않은 로컬 이미지를 노트 저장소에서 한 번에 정리할 수 있습니다.

> **개선 제안이나 새로운 아이디어가 있다면 issue를 통해 공유해 주세요. 적절한 제안은 신중하게 평가하여 채택하겠습니다.**

## 🚀 빠른 시작

1.  **플러그인 설치**
    Obsidian 커뮤니티 플러그인 시장을 열고 **Custom Image Auto Uploader**를 검색하여 설치합니다.

2.  **게이트웨이 설정 (선택 사항)**
    자체 구축 이미지 호스트를 사용하는 경우, **업로드 설정** > **API 게이트웨이 주소**를 사용자의 **Custom Image Gateway** 주소로 설정하십시오.
    > 예: `http://127.0.0.1:9000/api/upload`

3.  **인증 설정**
    보안을 위해 **API 액세스 토큰** (Token)을 설정합니다.

4.  **서비스 시작**
    원격 **Custom Image Gateway** 서비스가 시작되었으며 액세스 가능한지 확인합니다.

5.  **검증**
    새 노트를 만들고 이미지를 복사하여 붙여넣은 후 업로드가 성공했는지 확인합니다.

## ⚙️ 백엔드 서비스 (API 게이트웨이)

이 플러그인의 고급 기능은 **Custom Image Gateway**와 연동하여 사용해야 합니다.

> **Custom Image Gateway**는 무료 오픈 소스 이미지 업로드 게이트웨이 도구입니다.

*   **프로젝트 주소**: [haierkeys/custom-image-gateway](https://github.com/haierkeys/custom-image-gateway)
*   **배포 문서**: 프로젝트 홈페이지를 참고하여 배포하십시오.

## ☕ 후원 및 지원

이 플러그인이 유용하고 지속적인 개발을 지원하고 싶다면 커피 한 잔 사주셔도 좋습니다:

[<img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" alt="BuyMeACoffee" width="100">](https://ko-fi.com/haierkeys)
