# VoltGuard-Katalog — Online Metin Düzenleyici

Tarayıcıda çalışan, kurulum gerektirmeyen, **tam kapsamlı** bir zengin metin düzenleyici. Diğer modern çevrimiçi editörlerdeki özelliklerin yanında **entegre dijital imza** desteği sunar.

## Özellikler

- **Zengin metin biçimlendirme:** kalın, italik, altı çizili, üstü çizili, alt/üst simge, yazı tipi, boyut, yazı/arka plan rengi, başlıklar (H1–H4), alıntı, kod bloğu, satır aralığı (1.0 / 1.15 / 1.5 / 2.0)
- **Düzen araçları:** madde işaretli / numaralı listeler, hizalama (sol, orta, sağ, iki yana), girinti artırma/azaltma, büyük/küçük/başlık/cümle düzenine dönüştürme
- **Ekleme:** bağlantı, resim (yerel dosyadan), tablo (başlık seçenekli), yatay çizgi, sayfa sonu, özel karakter (para birimi, matematik, ok, şekil, Yunan…), emoji, bugünün tarihi / şimdiki saat
- **İmza:** fare veya dokunmatik ekranla çizilebilen, renk / kalınlık / şeffaf arka plan ayarlı, belgeye PNG olarak gömülen dijital imza
- **Dışa aktarma / Dosya:** yeni, aç (`.html` / `.txt`), HTML olarak kaydet, düz metin olarak kaydet, **Markdown olarak kaydet**, **PDF olarak dışa aktar** (sayfa boyutu + yön + kenar boşluğu ayarlı), yazdır
- **Görünüm:** yakınlaştırma (%50–%250), koyu / açık tema, tam ekran, kelime sayımı ayrıntıları (kelime, karakter, cümle, paragraf, okuma süresi), klavye kısayolları yardımı
- **Diğer:** geri al / yinele, bul ve değiştir (büyük/küçük duyarlılığı), otomatik kaydetme (`localStorage`), yazım denetimi aç/kapat, yapıştırılan içeriğin güvenlik için temizlenmesi

## Kullanım

Kurulum gerekmez — `index.html` dosyasını tarayıcınızda açın:

```bash
# Basit bir yerel sunucu (opsiyonel)
python3 -m http.server 8000
# ardından http://localhost:8000 adresini ziyaret edin
```

## Kısayollar

| Kısayol | İşlem |
|---|---|
| `Ctrl+B` / `Ctrl+I` / `Ctrl+U` | Kalın / İtalik / Altı çizili |
| `Ctrl+Z` / `Ctrl+Y` | Geri al / Yinele |
| `Ctrl+S` | HTML olarak kaydet |
| `Ctrl+Shift+P` | PDF olarak dışa aktar |
| `Ctrl+O` | Dosya aç |
| `Ctrl+P` | Yazdır |
| `Ctrl+F` | Bul ve değiştir |
| `Ctrl+A` | Tümünü seç |
| `Ctrl++` / `Ctrl+-` / `Ctrl+0` | Yakınlaştır / uzaklaştır / sıfırla |
| `Ctrl+Alt+S` | İmza ekle |
| `Ctrl+Alt+N` | Yeni belge |
| `Ctrl+Shift+V` | Düz metin olarak yapıştır |
| `F11` | Tam ekran |
| `Esc` | Aktif pencereyi kapat |

## Dosya yapısı

```
├── index.html    # Arayüz (menü, araç çubuğu, modallar)
├── styles.css    # Görsel tasarım (koyu/açık tema, yazdırma stilleri)
└── app.js        # Editör mantığı, imza çizim alanı, dosya G/Ç, otomatik kayıt
```
