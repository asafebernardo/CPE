import { useState } from 'react';
import {
  Box, Typography, TextField, IconButton, Collapse, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import type { Tr098ParameterNodeDto } from '@routergui/shared';
import { acsColors } from '../../theme/colors';

interface ParameterTreeProps {
  nodes: Tr098ParameterNodeDto[];
  onUpdate?: (path: string, value: string) => Promise<void>;
}

function TreeNode({
  node,
  depth,
  onSelect,
  selectedPath,
}: {
  node: Tr098ParameterNodeDto;
  depth: number;
  onSelect: (n: Tr098ParameterNodeDto) => void;
  selectedPath: string | null;
}) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedPath === node.path;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 0.5,
          pl: depth * 2,
          cursor: 'pointer',
          borderRadius: 1,
          bgcolor: isSelected ? 'rgba(34,211,238,0.1)' : 'transparent',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
        }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
            {open ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        ) : (
          <Box sx={{ width: 32 }} />
        )}
        <Typography variant="body2" sx={{ fontFamily: hasChildren ? undefined : 'monospace', fontSize: '0.8rem' }}>
          {node.name}
        </Typography>
        {!hasChildren && node.value && (
          <Typography variant="caption" sx={{ ml: 2, color: acsColors.textMuted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            = {node.value}
          </Typography>
        )}
      </Box>
      {hasChildren && (
        <Collapse in={open}>
          {node.children!.map((child) => (
            <TreeNode key={child.path} node={child} depth={depth + 1} onSelect={onSelect} selectedPath={selectedPath} />
          ))}
        </Collapse>
      )}
    </Box>
  );
}

export function ParameterTree({ nodes, onUpdate }: ParameterTreeProps) {
  const [selected, setSelected] = useState<Tr098ParameterNodeDto | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const openEdit = () => {
    if (!selected || !selected.writable) return;
    setEditValue(selected.value);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!selected || !onUpdate) return;
    await onUpdate(selected.path, editValue);
    setDialogOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, minHeight: 480 }}>
      <Box sx={{ flex: 1, border: `1px solid ${acsColors.border}`, borderRadius: 2, p: 2, overflow: 'auto', maxHeight: 600 }}>
        {nodes.map((n) => (
          <TreeNode key={n.path} node={n} depth={0} onSelect={setSelected} selectedPath={selected?.path ?? null} />
        ))}
      </Box>
      <Box sx={{ width: 320, border: `1px solid ${acsColors.border}`, borderRadius: 2, p: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>Parameter Detail</Typography>
        {selected ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">Path</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{selected.path}</Typography>
            <Typography variant="caption" color="text.secondary">Type</Typography>
            <Typography variant="body2">{selected.type}</Typography>
            <Typography variant="caption" color="text.secondary">Value</Typography>
            <Typography variant="body2" fontWeight={600}>{selected.value || '—'}</Typography>
            <Typography variant="caption" color="text.secondary">Writable</Typography>
            <Chip size="small" label={selected.writable ? 'Yes' : 'No'} color={selected.writable ? 'primary' : 'default'} />
            {selected.description && (
              <>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body2">{selected.description}</Typography>
              </>
            )}
            {selected.writable && onUpdate && (
              <Button size="small" startIcon={<EditIcon />} onClick={openEdit} sx={{ mt: 2 }}>
                Edit Value
              </Button>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">Select a parameter</Typography>
        )}
      </Box>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Parameter</DialogTitle>
        <DialogContent>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{selected?.path}</Typography>
          <TextField fullWidth margin="normal" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
