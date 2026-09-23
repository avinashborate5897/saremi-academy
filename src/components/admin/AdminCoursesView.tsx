import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, BookOpen, Clock, Users, Star } from 'lucide-react';
import { SaremiCard, SaremiButton, SaremiBadge, SaremiInput, SaremiEmptyState } from '../common/SaremiUI';

export const AdminCoursesView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState([
    { id: '1', title: 'Hindustani Classical Vocal', type: 'Vocal', level: 'All Levels', sessions: 8, status: 'Active', enrolled: 124 },
    { id: '2', title: 'Carnatic Classical Vocal', type: 'Vocal', level: 'All Levels', sessions: 8, status: 'Active', enrolled: 89 },
    { id: '3', title: 'Kathak Dance Foundation', type: 'Dance', level: 'Beginner', sessions: 4, status: 'Active', enrolled: 45 },
    { id: '4', title: 'Sitar Fundamentals', type: 'Instrumental', level: 'Beginner', sessions: 8, status: 'Draft', enrolled: 0 }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">Course & Program Management</h2>
          <p className="text-xs text-slate-500">Create, edit, and publish academy courses and syllabi.</p>
        </div>
        <SaremiButton variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
          Create New Course
        </SaremiButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SaremiCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Courses</p>
            <p className="text-2xl font-serif font-bold text-slate-900">24</p>
          </div>
        </SaremiCard>
        <SaremiCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Students</p>
            <p className="text-2xl font-serif font-bold text-slate-900">450+</p>
          </div>
        </SaremiCard>
      </div>

      <SaremiCard className="p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search courses..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none">
          <option value="all">All Categories</option>
          <option value="vocal">Vocal</option>
          <option value="instrumental">Instrumental</option>
          <option value="dance">Dance</option>
        </select>
      </SaremiCard>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4">Sessions</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase())).map((course) => (
                <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {course.title}
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">{course.enrolled} Active Enrollments</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {course.type}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                      {course.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {course.sessions} Sessions
                  </td>
                  <td className="px-6 py-4">
                    <SaremiBadge variant={course.status === 'Active' ? 'emerald' : 'slate'}>
                      {course.status}
                    </SaremiBadge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
