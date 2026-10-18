import { useParams } from 'react-router-dom'
import type { Season } from '../types'
import type { StatPlayer, MatchRecord, GameTypeStats } from '../utils'
import { calculateStats, calculateGameTypeStats, getSeasonIstakaKing, SEASON_MATCH_TARGET } from '../utils'
import Header from '../components/Header'
import Avatar from '../components/Avatar'
import NotFound from '../components/NotFound'

/** Zirvedeki değeri paylaşan tüm oyuncular (beraberlik gizlenmesin). */
function leaders(players: StatPlayer[], pick: (p: StatPlayer) => number, lowestWins = false) {
  if (players.length === 0) return { names: [] as string[], value: 0 }
  const values = players.map(pick)
  const best = lowestWins ? Math.min(...values) : Math.max(...values)
  return {
    names: players.filter(p => pick(p) === best).map(p => p.name),
    value: best,
  }
}

function LeaderCard({
  label, names, value, suffix = '', total,
}: { label: string; names: string[]; value: string; suffix?: string; total: number }) {
  if (names.length === 0) return null

  // Beraberlikler gizlenmesin ama "Ertuğrul +3" gibi sayı eklenmiş adlar da okunmasın.
  const allTied = names.length === total && total > 1
  const first = names[0].split(' ')[0]
  const title = allTied
    ? 'Tümü eşit'
    : names.length === 1
      ? first
      : names.length === 2
        ? `${first} ve ${names[1].split(' ')[0]}`
        : `${first} ve ${names.length - 1} kişi`

  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-navy-100">
      <div className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">{label}</div>
      <div className="flex items-center gap-2 mt-2">
        {allTied ? (
          <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5c7db5" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 9h14M5 15h14" />
            </svg>
          </div>
        ) : (
          <Avatar name={names[0]} size="sm" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-navy-800 truncate">{title}</div>
          <div className="text-[10px] text-navy-400 font-semibold">
            {value}{suffix}
          </div>
        </div>
      </div>
    </div>
  )
}

function RecordTile({
  label, hint, record, tone,
}: { label: string; hint: string; record: MatchRecord | null; tone: 'green' | 'amber' | 'navy' | 'red' }) {
  const palettes = {
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', sub: 'text-green-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', sub: 'text-amber-600' },
    navy:  { bg: 'bg-navy-100', border: 'border-navy-200', text: 'text-navy-700', sub: 'text-navy-500' },
    red:   { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', sub: 'text-red-600' },
  }
  const palette = palettes[tone]

  return (
    <div className={`${palette.bg} border ${palette.border} rounded-2xl p-4`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider ${palette.sub}`}>{label}</div>
      {record ? (
        <>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-bold ${palette.text}`}>{record.score}</span>
            <span className="text-sm font-bold text-navy-700 truncate">{record.playerName}</span>
          </div>
          <div className="text-[11px] text-navy-400 mt-1">
            {record.seasonName} · Maç {record.matchNumber}
          </div>
        </>
      ) : (
        <div className="text-sm text-navy-300 font-medium mt-1">Henüz yok</div>
      )}
      <div className="text-[10px] text-navy-400 mt-2 leading-4">{hint}</div>
    </div>
  )
}

const TRACK_TICKS = [1, 4, 8, 12]
const trackPct = (v: number) => ((v - 1) / 11) * 100

function GameTypeSection({ stats }: { stats: GameTypeStats }) {
  if (stats.matchCount === 0) return null

  return (
    <div>
      <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-2 px-1">
        Oyun Tipi İstatistikleri
      </h2>

      {/* Hangi dilimde hangi tip tercih ediliyor */}
      <div className="grid grid-cols-2 gap-3">
        {stats.slots.map(slot => (
          <div
            key={slot.key}
            className={`bg-white rounded-2xl p-3 shadow-sm border border-navy-100 ${
              slot.key === 'last1' ? 'col-span-2' : ''
            }`}
          >
            <div className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">
              {slot.label}
            </div>
            {slot.topNames.length === 0 ? (
              <div className="text-xs text-navy-300 font-medium mt-1.5">Veri yok</div>
            ) : (
              <>
                <div className="text-sm font-bold text-navy-800 mt-1 leading-5">
                  {slot.topNames.join(' / ')}
                </div>
                <div className="text-[10px] text-navy-400 font-semibold mt-0.5">
                  {slot.count}/{slot.total} kez · %{Math.round((slot.count / slot.total) * 100)}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Oyun tiplerinin maç içindeki ortalama sırası */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100 mt-3">
        <div className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">
          Ortalama Oynanma Sırası
        </div>
        <p className="text-[11px] text-navy-300 mb-3 mt-0.5">
          Nokta = ortalama sıra · çubuk = en erken–en geç
        </p>

        <div className="space-y-1.5">
          {stats.positions.map(p => (
            <div key={p.gameTypeId} className="flex items-center gap-1.5">
              <span className="w-[86px] shrink-0 text-[9px] font-semibold text-navy-600 leading-3">
                {p.name}
              </span>
              <div className="relative flex-1 h-4">
                {TRACK_TICKS.map(t => (
                  <span
                    key={t}
                    className="absolute inset-y-0 w-px bg-[#e1e0d9]"
                    style={{ left: `${trackPct(t)}%` }}
                  />
                ))}
                <span
                  className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-navy-200"
                  style={{
                    left: `${trackPct(p.min)}%`,
                    width: `${trackPct(p.max) - trackPct(p.min)}%`,
                  }}
                />
                <span
                  className="absolute top-1/2 w-2 h-2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white"
                  style={{ left: `${trackPct(p.average)}%`, background: '#2a78d6' }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-[9px] font-bold text-navy-700 tabular-nums">
                {p.average.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        {/* eksen */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-[86px] shrink-0" />
          <div className="relative flex-1 h-3">
            {TRACK_TICKS.map(t => (
              <span
                key={t}
                className="absolute text-[9px] text-navy-400 tabular-nums -translate-x-1/2"
                style={{ left: `${trackPct(t)}%` }}
              >
                {t}
              </span>
            ))}
          </div>
          <span className="w-6 shrink-0" />
        </div>
        <p className="text-[10px] text-navy-400 text-center mt-2">
          Maç içindeki el sırası (1 = ilk el, 12 = son el)
        </p>
      </div>
    </div>
  )
}

export default function StatsPage({ seasons }: { seasons: Season[] }) {
  const { seasonId } = useParams<{ seasonId?: string }>()
  const season = seasonId ? seasons.find(s => s.id === seasonId) : undefined

  if (seasonId && !season) return <NotFound message="Sezon bulunamadı." />

  const scoped = season ? [season] : seasons
  const stats = calculateStats(scoped)
  const gameTypeStats = calculateGameTypeStats(scoped)
  const kings = scoped
    .map(s => ({ season: s, king: getSeasonIstakaKing(s) }))
    .filter((x): x is { season: Season; king: NonNullable<ReturnType<typeof getSeasonIstakaKing>> } => x.king !== null)

  const hasData = stats.players.length > 0 && stats.matchCount > 0

  return (
    <div className="flex flex-col min-h-svh bg-navy-50">
      <Header
        title="İstatistikler"
        back={season ? `/season/${season.id}` : '/'}
        subtitle={season ? season.name : 'Tüm sezonlar'}
      />
      <div className="flex-1 p-4 space-y-4 page-enter">

        {!hasData ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-navy-100 text-center">
            <p className="text-navy-600 text-sm font-bold">Henüz istatistik yok</p>
            <p className="text-navy-400 text-xs mt-1.5">İlk maç tamamlanınca burası dolar.</p>
          </div>
        ) : (
          <>
            {/* Özet */}
            <div className="bg-navy-800 rounded-2xl px-4 py-3 flex justify-around text-center text-white">
              {!season && (
                <div>
                  <div className="text-xl font-bold">{stats.seasonCount}</div>
                  <div className="text-[10px] text-navy-300 font-bold uppercase tracking-wide">sezon</div>
                </div>
              )}
              <div>
                <div className="text-xl font-bold">{stats.matchCount}</div>
                <div className="text-[10px] text-navy-300 font-bold uppercase tracking-wide">maç</div>
              </div>
              <div>
                <div className="text-xl font-bold">{stats.gameCount}</div>
                <div className="text-[10px] text-navy-300 font-bold uppercase tracking-wide">el</div>
              </div>
              <div>
                <div className="text-xl font-bold">{stats.players.length}</div>
                <div className="text-[10px] text-navy-300 font-bold uppercase tracking-wide">oyuncu</div>
              </div>
            </div>

            {/* Galibiyet rekorları */}
            <div>
              <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-2 px-1">
                Maç Kazanma Rekorları
              </h2>
              <div className="space-y-3">
                <RecordTile
                  label="En az puanla galibiyet"
                  hint="Bir maçı kazanan en düşük toplam skor — en ezici galibiyet."
                  record={stats.lowestWinningScore}
                  tone="green"
                />
                <RecordTile
                  label="En çok puanla galibiyet"
                  hint="Yine de maçı kazanan en yüksek toplam skor — en çekişmeli galibiyet."
                  record={stats.highestWinningScore}
                  tone="amber"
                />
              </div>
            </div>

            {/* Sonunculuk rekorları */}
            <div>
              <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-2 px-1">
                Maç Kaybetme Rekorları
              </h2>
              <div className="space-y-3">
                <RecordTile
                  label="En az puanla 4. olma"
                  hint="İyi oynayıp yine de sonuncu olunan en düşük skor — en şanssız maç."
                  record={stats.lowestLastPlaceScore}
                  tone="navy"
                />
                <RecordTile
                  label="En çok puanla 4. olma"
                  hint="Sonuncu olunan en yüksek toplam skor — en kötü maç."
                  record={stats.highestLastPlaceScore}
                  tone="red"
                />
              </div>
            </div>

            {/* Ünvanlar */}
            <div>
              <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-2 px-1">
                Istaka Kralı
              </h2>
              {kings.length === 0 ? (
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-navy-100">
                  <p className="text-xs text-navy-400 leading-5">
                    Ünvan, sezon <span className="font-bold">{SEASON_MATCH_TARGET} maçta</span> bitince
                    en çok el açan oyuncuya verilir. Henüz biten sezon yok.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden divide-y divide-navy-50">
                  {kings.map(({ season: s, king }) => (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinejoin="round">
                          <path d="M3 8l4.5 3.5L12 5l4.5 6.5L21 8l-1.8 10H4.8z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-navy-800 truncate">
                          {king.player.name}
                          {king.shared && <span className="text-[11px] text-navy-400 font-semibold"> (paylaşımlı)</span>}
                        </div>
                        <div className="text-[11px] text-navy-400">{s.name}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-emerald-600 leading-none">{king.openings}</div>
                        <div className="text-[10px] text-navy-400 font-bold uppercase">el</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Zirvedekiler */}
            <div>
              <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-2 px-1">
                Zirvedekiler
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const openings = leaders(stats.players, p => p.openings)
                  const seconds = leaders(stats.players, p => p.seconds)
                  const played = leaders(stats.players, p => p.matchesPlayed)
                  const wins = leaders(stats.players, p => p.wins)
                  const avgPts = leaders(stats.players, p => p.avgLeaguePoints)
                  const avgScore = leaders(stats.players, p => p.avgScore, true)
                  const n = stats.players.length
                  return (
                    <>
                      <LeaderCard total={n} label="En çok el açan" names={openings.names} value={String(openings.value)} suffix=" el" />
                      <LeaderCard total={n} label="En çok ikinci olan" names={seconds.names} value={String(seconds.value)} suffix=" kez" />
                      <LeaderCard total={n} label="En çok maç oynayan" names={played.names} value={String(played.value)} suffix=" maç" />
                      <LeaderCard total={n} label="En çok maç kazanan" names={wins.names} value={String(wins.value)} suffix=" galibiyet" />
                      <LeaderCard total={n} label="En iyi puan ortalaması" names={avgPts.names} value={avgPts.value.toFixed(2)} suffix=" puan/maç" />
                      <LeaderCard total={n} label="En iyi skor ortalaması" names={avgScore.names} value={avgScore.value.toFixed(0)} suffix=" skor/maç" />
                    </>
                  )
                })()}
              </div>
            </div>

            <GameTypeSection stats={gameTypeStats} />

            {/* Tüm oyuncular */}
            <div>
              <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-2 px-1">
                Tüm Oyuncular
              </h2>
              <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="text-[10px] text-navy-400 uppercase tracking-wider">
                      <th className="text-left font-bold px-3 py-2 sticky left-0 bg-white">Oyuncu</th>
                      <th className="font-bold px-2 py-2 text-center">M</th>
                      <th className="font-bold px-2 py-2 text-center">G</th>
                      <th className="font-bold px-2 py-2 text-center">2.</th>
                      <th className="font-bold px-2 py-2 text-center">El</th>
                      <th className="font-bold px-2 py-2 text-center">P</th>
                      <th className="font-bold px-2 py-2 text-center whitespace-nowrap">Ort.P</th>
                      <th className="font-bold px-2 py-2 text-center whitespace-nowrap">Ort.Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50">
                    {stats.players.map(p => (
                      <tr key={p.name}>
                        <td className="px-3 py-2 font-bold text-navy-800 whitespace-nowrap sticky left-0 bg-white">
                          <span className="inline-flex items-center gap-2">
                            <Avatar name={p.name} size="sm" />
                            {p.name.split(' ')[0]}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center tabular-nums text-navy-500">{p.matchesPlayed}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-navy-500">{p.wins}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-navy-500">{p.seconds}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-navy-500">{p.openings}</td>
                        <td className="px-2 py-2 text-center tabular-nums font-bold text-navy-800">{p.leaguePoints}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-navy-700">{p.avgLeaguePoints.toFixed(2)}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-navy-700">{p.avgScore.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-navy-400 text-center mt-2 leading-5">
                M: Maç · G: Galibiyet · 2.: İkincilik · El: El Açma · P: Lig Puanı<br />
                Ort.P yüksek iyi · <span className="font-bold">Ort.Skor düşük iyi</span>
              </p>
            </div>

            {!season && (
              <p className="text-[11px] text-navy-400 text-center leading-5">
                Oyuncular sezonlar arasında isme göre eşleştirilir.
              </p>
            )}
          </>
        )}

        <div className="h-2" />
      </div>
    </div>
  )
}
