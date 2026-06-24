import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { EventTimeline } from '../../components/tr069/EventTimeline';
import type { Tr069EventDto } from '@routergui/shared';

export function Tr069EventViewerPage() {
  const [events, setEvents] = useState<Tr069EventDto[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/operational/tr069/events${q}`).then((res) => setEvents(res.data));
  }, [search]);

  return (
    <Box>
      <PageHeader title="Event Viewer" subtitle="CWMP session events, Inform cycles and ACS commands." />
      <EventTimeline events={events} search={search} onSearchChange={setSearch} />
    </Box>
  );
}
