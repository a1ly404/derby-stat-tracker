import { useState, useEffect } from 'react'
import { ScoreGraph } from './components/ScoreGraph'
import { Card } from './components/ui/card'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Separator } from './components/ui/separator'
import { Switch } from './components/ui/switch'
import { Label } from './components/ui/label'
import { Plus, Timer, WifiHigh, WifiSlash, Coffee } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface JamScore {
  jam: number
  team1Score: number
  team2Score: number
  team1Total: number
  team2Total: number
  period: number
  isIntermission?: boolean
}

interface ApiGame {
  id: string
  team1: string
  team2: string
  team1Score: number
  team2Score: number
  currentJam: number
  jams: ApiJam[]
}

interface ApiJam {
  jamNumber: number
  team1Points: number
  team2Points: number
  period: number
}

function App() {
  const [apiUrl, setApiUrl] = useState('')
  const [pollEnabled, setPollEnabled] = useState(false)
  const [pollInterval, setPollInterval] = useState(5000)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  const [jamData, setJamData] = useState<JamScore[]>([])
  const [team1Name, setTeam1Name] = useState('Team 1')
  const [team2Name, setTeam2Name] = useState('Team 2')
  
  const [team1Input, setTeam1Input] = useState('')
  const [team2Input, setTeam2Input] = useState('')
  const [currentPeriod, setCurrentPeriod] = useState(1)

  const currentJam = jamData.length
  const team1Total = jamData.length > 0 ? jamData[jamData.length - 1].team1Total : 0
  const team2Total = jamData.length > 0 ? jamData[jamData.length - 1].team2Total : 0

  const fetchGameData = async () => {
    if (!apiUrl) return

    try {
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const gameData: ApiGame = await response.json()
      
      setTeam1Name(gameData.team1 || 'Team 1')
      setTeam2Name(gameData.team2 || 'Team 2')
      
      const processedJams: JamScore[] = []
      let team1Running = 0
      let team2Running = 0
      let lastPeriod = 0
      
      gameData.jams.forEach((jam, index) => {
        if (jam.period > lastPeriod && lastPeriod > 0) {
          processedJams.push({
            jam: processedJams.length > 0 ? processedJams[processedJams.length - 1].jam : 0,
            team1Score: 0,
            team2Score: 0,
            team1Total: team1Running,
            team2Total: team2Running,
            period: lastPeriod,
            isIntermission: true,
          })
        }
        
        lastPeriod = jam.period
        team1Running += jam.team1Points
        team2Running += jam.team2Points
        
        processedJams.push({
          jam: jam.jamNumber,
          team1Score: jam.team1Points,
          team2Score: jam.team2Points,
          team1Total: team1Running,
          team2Total: team2Running,
          period: jam.period,
        })
      })
      
      setJamData(processedJams)
      if (gameData.jams.length > 0) {
        setCurrentPeriod(gameData.jams[gameData.jams.length - 1].period)
      }
      setIsConnected(true)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch game data:', error)
      setIsConnected(false)
      toast.error('Failed to connect to API')
    }
  }

  useEffect(() => {
    if (!pollEnabled || !apiUrl) {
      setIsConnected(false)
      return
    }

    fetchGameData()
    
    const interval = setInterval(fetchGameData, pollInterval)
    
    return () => clearInterval(interval)
  }, [pollEnabled, apiUrl, pollInterval])

  const handleAddJam = () => {
    const team1Score = parseInt(team1Input) || 0
    const team2Score = parseInt(team2Input) || 0

    if (team1Score < 0 || team2Score < 0) {
      toast.error('Scores must be non-negative')
      return
    }

    const newJam: JamScore = {
      jam: currentJam + 1,
      team1Score,
      team2Score,
      team1Total: team1Total + team1Score,
      team2Total: team2Total + team2Score,
      period: currentPeriod,
    }

    setJamData((current) => [...current, newJam])
    setTeam1Input('')
    setTeam2Input('')
    toast.success(`Jam ${currentJam + 1} added`)
  }

  const handleAddIntermission = () => {
    const intermission: JamScore = {
      jam: currentJam,
      team1Score: 0,
      team2Score: 0,
      team1Total,
      team2Total,
      period: currentPeriod,
      isIntermission: true,
    }

    setJamData((current) => [...current, intermission])
    setCurrentPeriod((p) => p + 1)
    toast.success(`Intermission - Starting Period ${currentPeriod + 1}`)
  }

  const handleReset = () => {
    setJamData([])
    setTeam1Input('')
    setTeam2Input('')
    setCurrentPeriod(1)
    toast.success('Scoreboard reset')
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground tracking-tight">
            Derby Scoreboard Live
          </h1>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Timer size={20} className="text-accent" weight="fill" />
            <Badge variant="outline" className="bg-muted border-accent text-accent font-medium">
              Period {currentPeriod} • Jam {currentJam}
            </Badge>
            {pollEnabled && (
              <Badge variant="outline" className={`${isConnected ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-red-900/20 border-red-500 text-red-400'} flex items-center gap-1`}>
                {isConnected ? <WifiHigh size={16} weight="fill" /> : <WifiSlash size={16} weight="fill" />}
                {isConnected ? 'Live' : 'Disconnected'}
              </Badge>
            )}
          </div>
          {lastUpdate && pollEnabled && (
            <p className="text-xs text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        <Card className="bg-card border-border p-6">
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-semibold text-foreground">API Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-url">API Endpoint URL</Label>
                <Input
                  id="api-url"
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com/game"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poll-interval">Poll Interval (ms)</Label>
                <Input
                  id="poll-interval"
                  type="number"
                  min="1000"
                  step="1000"
                  value={pollInterval}
                  onChange={(e) => setPollInterval(parseInt(e.target.value) || 5000)}
                  className="bg-background"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="poll-enabled"
                checked={pollEnabled}
                onCheckedChange={(checked) => setPollEnabled(checked)}
              />
              <Label htmlFor="poll-enabled" className="cursor-pointer">
                Enable Live Polling {pollEnabled && `(every ${pollInterval / 1000}s)`}
              </Label>
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="text-center space-y-2">
              <Input
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                className="text-center font-display text-2xl font-semibold bg-background border-primary text-foreground mb-2"
                placeholder="Team 1 Name"
                disabled={pollEnabled}
              />
              <div className="font-display text-7xl md:text-8xl font-bold text-primary leading-none">
                {team1Total}
              </div>
            </div>
            <div className="text-center space-y-2">
              <Input
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                className="text-center font-display text-2xl font-semibold bg-background border-secondary text-foreground mb-2"
                placeholder="Team 2 Name"
                disabled={pollEnabled}
              />
              <div className="font-display text-7xl md:text-8xl font-bold text-secondary leading-none">
                {team2Total}
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-border" />

          {jamData.length === 0 ? (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <p className="text-xl font-medium">No jams recorded yet</p>
                <p className="text-sm">
                  {pollEnabled ? 'Waiting for API data...' : 'Add your first jam below or enable API polling'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <ScoreGraph data={jamData} team1Name={team1Name} team2Name={team2Name} />
            </div>
          )}

          {!pollEnabled && (
            <>
              <Separator className="my-8 bg-border" />

              <div className="space-y-4">
                <h2 className="font-display text-3xl font-semibold text-foreground">Add Jam Score</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {team1Name} Score
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={team1Input}
                      onChange={(e) => setTeam1Input(e.target.value)}
                      placeholder="0"
                      className="text-lg bg-background border-primary/50"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddJam()}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {team2Name} Score
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={team2Input}
                      onChange={(e) => setTeam2Input(e.target.value)}
                      placeholder="0"
                      className="text-lg bg-background border-secondary/50"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddJam()}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground opacity-0 hidden md:block">
                      Actions
                    </label>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddJam}
                        className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                      >
                        <Plus size={20} weight="bold" />
                        Add Jam
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={handleAddIntermission}
                    variant="outline"
                    className="border-accent/50 text-accent hover:bg-accent/10"
                  >
                    <Coffee size={20} weight="fill" />
                    Add Intermission
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground md:hidden"
                  >
                    Reset
                  </Button>
                </div>
                <div className="hidden md:block">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Reset Scoreboard
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Live Derby Scoreboard • {pollEnabled ? 'Polling API for updates' : 'Ready for manual input'}</p>
        </div>
      </div>
    </div>
  )
}

export default App
