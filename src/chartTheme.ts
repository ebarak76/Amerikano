// Doğrulanmış kategorik palet (dataviz referans paleti, slot sırası korunur).
// Beyaz zeminde: parlaklık bandı / kroma / CVD ayrımı / normal görüş eşiği -> tümü PASS.
// Üç renk 3:1 kontrastın altında, bu yüzden renk tek başına taşıyıcı değil:
// efsane, uç-nokta etiketleri ve tablo görünümü kimliği ayrıca veriyor.
export const SERIES_COLORS = [
  '#2a78d6', // mavi
  '#eb6834', // turuncu
  '#1baf7a', // deniz yeşili
  '#eda100', // sarı
  '#e87ba4', // magenta
  '#008300', // yeşil
  '#4a3aa7', // mor
  '#e34948', // kırmızı
]

const OVERFLOW_COLOR = '#898781'

export function seriesColor(index: number): string {
  // 8'den sonra renk üretmek/döngülemek CVD güvenliğini bozar; fazlası nötr kalır
  // ve kimliğini efsaneye dokunarak (izole etme) + tablodan alır.
  return index < SERIES_COLORS.length ? SERIES_COLORS[index] : OVERFLOW_COLOR
}
