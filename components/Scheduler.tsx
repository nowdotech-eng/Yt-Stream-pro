import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, AlertTriangle, X, Video as VideoIcon } from 'lucide-react';
import { Schedule, Video, CreateScheduleRequest } from '../types';
import { api } from '../services/api';

interface SchedulerProps {
  videos: Video[];
}

export const Scheduler: React.FC<SchedulerProps> = ({ videos }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<CreateScheduleRequest>({
    startAt: '',
    endAt: '',
    playlist: [],
    loopMode: 'single',
    repeats: 1,
    streamKey: '',
    title: ''
  });

  const fetchSchedules = async () => {
    try {
      const data = await api.getSchedules();
      // Sort by start time
      setSchedules(data.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchedules();
    const interval = setInterval(fetchSchedules, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startAt || formData.playlist.length === 0 || !formData.streamKey) {
      return alert('Please fill required fields');
    }
    try {
      await api.createSchedule(formData);
      setShowForm(false);
      fetchSchedules();
      // Reset minimal form state
      setFormData({ ...formData, playlist: [], title: '', startAt: '', endAt: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to create schedule');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this schedule?')) return;
    try {
      await api.cancelSchedule(id);
      fetchSchedules();
    } catch (err) {
      alert('Failed to cancel');
    }
  };

  const addToPlaylist = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val) {
          setFormData(prev => ({ ...prev, playlist: [...prev.playlist, val] }));
          e.target.value = '';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Scheduled Streams</h2>
        <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
            <Plus className="h-4 w-4" />
            New Schedule
        </button>
      </div>

      <div className="grid gap-4">
        {schedules.map((s) => {
            const isPast = new Date(s.startAt).getTime() < Date.now();
            const statusColor = s.started ? (s.stopped ? 'text-gray-500' : 'text-green-500') : (isPast ? 'text-red-500' : 'text-blue-500');
            const statusText = s.started ? (s.stopped ? 'Completed' : 'Live Now') : (isPast ? 'Missed' : 'Upcoming');
            
            return (
                <div key={s.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="bg-muted/50 p-3 rounded-md text-center min-w-[80px]">
                            <div className="text-xs font-bold text-muted-foreground uppercase">{new Date(s.startAt).toLocaleDateString(undefined, { month: 'short' })}</div>
                            <div className="text-2xl font-bold">{new Date(s.startAt).getDate()}</div>
                            <div className="text-xs text-muted-foreground">{new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{s.title || 'Untitled Stream'}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1"><VideoIcon className="h-3 w-3" /> {s.playlist.length} Videos</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.loopMode}</span>
                                <span className={`font-medium ${statusColor}`}>• {statusText}</span>
                            </div>
                        </div>
                    </div>
                    {!s.started && (
                        <button 
                            onClick={() => handleCancel(s.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    )}
                </div>
            )
        })}
        {schedules.length === 0 && <p className="text-center text-muted-foreground py-8">No upcoming schedules.</p>}
      </div>

      {/* Create Schedule Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl my-8">
                <form onSubmit={handleCreate} className="flex flex-col">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Schedule Broadcast</h3>
                        <button type="button" onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Event Title</label>
                            <input 
                                required 
                                type="text" 
                                className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Start Time</label>
                                <input 
                                    required 
                                    type="datetime-local" 
                                    className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                                    value={formData.startAt}
                                    onChange={e => setFormData({...formData, startAt: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">End Time (Optional)</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                                    value={formData.endAt}
                                    onChange={e => setFormData({...formData, endAt: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Stream Key</label>
                            <input 
                                required 
                                type="password" 
                                className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                                value={formData.streamKey}
                                onChange={e => setFormData({...formData, streamKey: e.target.value})}
                            />
                        </div>

                        <div>
                             <label className="block text-sm font-medium mb-1">Add Videos to Playlist</label>
                             <select 
                                className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                                onChange={addToPlaylist}
                             >
                                <option value="">Select a video...</option>
                                {videos.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                             </select>
                             <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                {formData.playlist.map((pid, idx) => {
                                    const vid = videos.find(v => v.id === pid);
                                    return (
                                        <div key={idx} className="flex items-center justify-between text-sm bg-muted px-2 py-1 rounded">
                                            <span className="truncate">{vid?.name || pid}</span>
                                            <button 
                                                type="button"
                                                onClick={() => setFormData(prev => ({...prev, playlist: prev.playlist.filter((_, i) => i !== idx)}))}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                        <button 
                            type="button" 
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 rounded-md hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
                        >
                            Schedule Event
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
