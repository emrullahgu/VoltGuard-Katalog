# VoltGuard-Katalog — Online Metin Düzenleyici

Tarayıcıda çalışan, kurulum gerektirmeyen, **tam kapsamlı** bir zengin metin düzenleyici. Diğer modern çevrimiçi editörlerdeki özelliklerin yanında **entegre dijital imza** desteği sunar.

## Özellikler

- **Zengin metin biçimlendirme:** kalın, italik, altı çizili, üstü çizili, alt/üst simge, yazı tipi, boyut, yazı/arka plan rengi, başlıklar (H1–H4), alıntı, kod bloğu
- **Düzen araçları:** madde işaretli / numaralı listeler, hizalama (sol, orta, sağ, iki yana), girinti artırma/azaltma
- **Ekleme:** bağlantı, resim (yerel dosyadan), tablo (başlık seçenekli), yatay çizgi
- **İmza:** fare veya dokunmatik ekranla çizilebilen, renk / kalınlık / şeffaf arka plan ayarlı, belgeye PNG olarak gömülen dijital imza
- **Dosya:** yeni, aç (`.html` / `.txt`), HTML olarak kaydet, düz metin olarak kaydet, yazdır / PDF'e aktar
- **Diğer:** geri al / yinele, bul ve değiştir, otomatik kaydetme (`localStorage`), koyu / açık tema, tam ekran, kelime ve karakter sayacı, kısayol tuşları, yapıştırılan içeriğin güvenlik için temizlenmesi

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
| `Ctrl+O` | Dosya aç |
| `Ctrl+P` | Yazdır / PDF |
| `Ctrl+F` | Bul ve değiştir |
| `Ctrl+Alt+S` | İmza ekle |
| `Ctrl+Alt+N` | Yeni belge |
| `Ctrl+Shift+V` | Düz metin olarak yapıştır |

## Dosya yapısı

```
├── index.html    # Arayüz (menü, araç çubuğu, modallar)
├── styles.css    # Görsel tasarım (koyu/açık tema, yazdırma stilleri)
└── app.js        # Editör mantığı, imza çizim alanı, dosya G/Ç, otomatik kayıt
```
