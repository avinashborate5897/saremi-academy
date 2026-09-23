import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button, Badge } from '../../design-system';
import { Upload, Video, Mic, CheckCircle2, Clock, XCircle, Calendar, Star, MessageCircle, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../lib/dashboardService';

type SubmissionStatus = 'submitted' | 'under review' | 'selected' | 'rejected' | 'scheduled' | 'completed';

interface Submission {
  id: string;
  studentId?: string;
  title: string;
  type: 'audio' | 'video';
  date: string;
  status: SubmissionStatus;
  feedback?: string;
  event?: string;
  recordingUrl?: string;
}

export const StudentSubmissionsView: React.FC = () => {
  const { user, profile } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'audio'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'audio' | 'video'>('video');

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newEvent, setNewEvent] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const studentId = user?.uid || profile?.id || '';

  const loadSubmissions = async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await dashboardService.getStudentSubmissions(studentId);
      setSubmissions(data as Submission[]);
    } catch (err) {
      console.error('Failed to load student submissions:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [studentId]);

  const handleOpenUpload = (type: 'audio' | 'video') => {
    setUploadType(type);
    setNewTitle('');
    setNewEvent('');
    setNewUrl('');
    setIsUploading(true);
  };

  const handleCreateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (!studentId) return;

    setIsSubmitting(true);
    try {
      await dashboardService.addStudentSubmission({
        studentId,
        studentName: profile?.name || user?.displayName || 'Student Musician',
        title: newTitle.trim(),
        type: uploadType,
        event: newEvent.trim() || 'Annual Conservatory Showcase',
        date: new Date().toISOString().split('T')[0],
        status: 'submitted',
        recordingUrl: newUrl.trim() || undefined
      });
      setIsUploading(false);
      await loadSubmissions();
    } catch (err) {
      console.error('Failed to create submission:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'selected': return 'green';
      case 'completed': return 'purple';
      case 'rejected': return 'red';
      case 'under review': return 'yellow';
      case 'scheduled': return 'blue';
      default: return 'gray';
    }
  };

  const filtered = submissions.filter(sub => activeTab === 'all' || sub.type === activeTab);

  return (
    <div className="space-y-8 pb-20 sm:pb-0 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-3xl font-bold text-gray-900">Performance Submissions</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">Submit your audition tapes and performance recordings.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => handleOpenUpload('audio')} leftIcon={<Mic className="w-4 h-4"/>}>
            Audio Recording
          </Button>
          <Button variant="primary" onClick={() => handleOpenUpload('video')} leftIcon={<Video className="w-4 h-4"/>}>
            Video Audition
          </Button>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
               <button 
                 onClick={() => setIsUploading(false)} 
                 className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 cursor-pointer"
               >
                 <XCircle className="w-6 h-6" />
               </button>

               <div className="flex items-center gap-2 mb-2">
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${uploadType === 'video' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                   {uploadType === 'video' ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                 </div>
                 <h3 className="font-serif text-2xl font-bold text-gray-900">
                   Submit {uploadType === 'video' ? 'Video Performance' : 'Audio Track'}
                 </h3>
               </div>
               <p className="text-sm text-gray-500 mb-5 font-medium">
                 Upload your classical piece or provide a link for Guru assessment.
               </p>
               
               <form onSubmit={handleCreateSubmission} className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                     Composition / Piece Title *
                   </label>
                   <input
                     type="text"
                     required
                     value={newTitle}
                     onChange={(e) => setNewTitle(e.target.value)}
                     placeholder="e.g. Raag Yaman Drut Bandish in Teentaal"
                     className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                   />
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                     Event / Evaluation Purpose
                   </label>
                   <input
                     type="text"
                     value={newEvent}
                     onChange={(e) => setNewEvent(e.target.value)}
                     placeholder="e.g. Conservatory Winter Showcase or Guru Review"
                     className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                   />
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                     Recording / Cloud Link (Optional)
                   </label>
                   <input
                     type="url"
                     value={newUrl}
                     onChange={(e) => setNewUrl(e.target.value)}
                     placeholder="https://drive.google.com/... or YouTube unlisted"
                     className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                   />
                 </div>

                 <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-gray-50">
                   <Upload className="w-8 h-8 text-gray-400 mb-2" />
                   <span className="text-xs font-bold text-gray-700">Audio/Video recorded or uploaded</span>
                   <span className="text-[11px] text-gray-500 mt-0.5">Direct studio file or cloud streaming URL</span>
                 </div>
                 
                 <div className="flex gap-3 pt-2">
                   <button
                     type="button"
                     onClick={() => setIsUploading(false)}
                     className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     disabled={isSubmitting || !newTitle.trim()}
                     className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gray-900 hover:bg-black transition-colors shadow-md disabled:opacity-50"
                   >
                     {isSubmitting ? 'Submitting...' : 'Submit Entry'}
                   </button>
                 </div>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
        {(['all', 'video', 'audio'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-colors cursor-pointer ${
              activeTab === tab ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {tab} {tab !== 'all' ? `(${submissions.filter(s => s.type === tab).length})` : `(${submissions.length})`}
          </button>
        ))}
      </div>

      {/* Grid or Empty State */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 font-medium">
          Loading performance submissions...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-gray-200 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-7 h-7 text-amber-600" />
          </div>
          <h4 className="font-serif font-bold text-xl text-gray-900 mb-1">
            No Submissions Found
          </h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
            You haven't submitted any performance or audition recordings yet. Submit your vocal or instrumental work for faculty review.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleOpenUpload('video')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gray-900 hover:bg-black transition-colors shadow-md inline-flex items-center gap-2"
            >
              <Video className="w-4 h-4 text-amber-400" />
              <span>Submit Video</span>
            </button>
            <button
              onClick={() => handleOpenUpload('audio')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-800 bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
            >
              <Mic className="w-4 h-4 text-amber-600" />
              <span>Submit Audio</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map(sub => (
            <Card key={sub.id} variant="default" padding="lg" className="flex flex-col relative overflow-hidden group">
              {/* Status Strip */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                sub.status === 'selected' ? 'bg-saremi-green' : 
                sub.status === 'rejected' ? 'bg-red-500' :
                sub.status === 'completed' ? 'bg-saremi-purple' :
                sub.status === 'scheduled' ? 'bg-blue-500' : 'bg-saremi-yellow'
              }`} />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sub.type === 'video' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                     {sub.type === 'video' ? <Video className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                   </div>
                   <div>
                     <h4 className="font-serif text-lg font-bold text-gray-900 leading-tight">{sub.title}</h4>
                     <span className="text-xs font-bold text-gray-400">{sub.date}</span>
                   </div>
                </div>
                <Badge variant={getStatusColor(sub.status)} size="sm" className="capitalize">
                  {sub.status.replace('-', ' ')}
                </Badge>
              </div>

              {sub.event && (
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <Calendar className="w-4 h-4 text-gray-400" /> Event: {sub.event}
                </div>
              )}

              {sub.recordingUrl && (
                <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/50 mb-3 truncate">
                  Recording URL: <a href={sub.recordingUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">{sub.recordingUrl}</a>
                </div>
              )}

              {sub.feedback ? (
                <div className="mt-auto bg-saremi-soft-purple/50 border border-saremi-purple/20 p-3.5 rounded-xl flex items-start gap-3">
                   <MessageCircle className="w-5 h-5 text-saremi-primary shrink-0 mt-0.5" />
                   <p className="text-sm font-medium text-saremi-primary leading-relaxed">{sub.feedback}</p>
                </div>
              ) : (
                <div className="mt-auto text-xs text-gray-400 italic">
                  Pending faculty mentor review. Feedback will appear here.
                </div>
              )}
              
              {sub.status === 'completed' && (
                <div className="mt-4 flex items-center gap-2 text-saremi-green font-bold text-sm bg-green-50 p-2 rounded-lg border border-green-100">
                  <Star className="w-4 h-4" fill="currentColor" /> Awarded: Showcase Performer Badge
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};
