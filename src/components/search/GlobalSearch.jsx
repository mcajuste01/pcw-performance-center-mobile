import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, User, ClipboardList, Video, MessageSquare, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v?.items && Array.isArray(v.items)) return v.items;
  return [];
};

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: users = [] } = useQuery({
    queryKey: ['searchUsers', debouncedQuery],
    queryFn: async () => {
      const res = await base44.entities.User.list();
      return toArray(res);
    },
    enabled: debouncedQuery.length > 2,
    initialData: [],
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['searchAssignments', debouncedQuery],
    queryFn: async () => {
      const res = await base44.entities.Assignment.list('-created_date', 50);
      return toArray(res);
    },
    enabled: debouncedQuery.length > 2,
    initialData: [],
  });

  const { data: events = [] } = useQuery({
    queryKey: ['searchEvents', debouncedQuery],
    queryFn: async () => {
      const res = await base44.entities.Event.list('event_date', 50);
      return toArray(res);
    },
    enabled: debouncedQuery.length > 2,
    initialData: [],
  });

  const filterResults = (items, searchFields) => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => item[field]?.toLowerCase().includes(q))
    ).slice(0, 5);
  };

  const filteredUsers = filterResults(users, ['full_name', 'wrestling_name', 'email']);
  const filteredAssignments = filterResults(assignments, ['title', 'description']);
  const filteredEvents = filterResults(events, ['event_name', 'description', 'location']);

  const hasResults = filteredUsers.length > 0 || filteredAssignments.length > 0 || filteredEvents.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search trainees, assignments, events..."
          className="bg-gray-900 border-gray-700 text-white pl-10"
        />
      </div>

      {showResults && debouncedQuery.length > 2 && (
        <Card className="absolute top-full mt-2 w-full z-50 border-gray-800 max-h-96 overflow-y-auto"
              style={{ background: '#0f0f0f' }}>
          <CardContent className="p-2">
            {!hasResults && (
              <p className="text-gray-500 text-sm p-3">No results found</p>
            )}

            {filteredUsers.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 px-2 py-1">Trainees</p>
                {filteredUsers.map(user => (
                  <Link
                    key={user.id}
                    to={createPageUrl('Profile')}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="text-sm text-white">{user.wrestling_name || user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.tier}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {filteredAssignments.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 px-2 py-1">Assignments</p>
                {filteredAssignments.map(assignment => (
                  <Link
                    key={assignment.id}
                    to={createPageUrl('Assignments')}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 transition-colors"
                  >
                    <ClipboardList className="w-4 h-4 text-red-400" />
                    <div>
                      <p className="text-sm text-white">{assignment.title}</p>
                      <p className="text-xs text-gray-500">{assignment.tier}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {filteredEvents.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 px-2 py-1">Events</p>
                {filteredEvents.map(event => (
                  <Link
                    key={event.id}
                    to={createPageUrl('Events')}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-sm text-white">{event.event_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.event_date).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}