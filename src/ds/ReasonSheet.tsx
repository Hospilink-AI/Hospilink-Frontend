import { ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import Button from './Button';
import { Radio } from './Controls';
import Field from './Field';
import { Sheet } from './Overlay';
import { Notice } from './States';
import Txt from './Txt';

type Option = { label: string; value: string };

/** A decision that may need a reason and a note. Same contract as the shared ActionModal. */
export default function ReasonSheet({
  visible,
  title,
  message,
  reasons,
  showNote = !!reasons,
  noteRequired = false,
  noteMax = 500,
  notePlaceholder = 'Add a note (optional)',
  confirmLabel,
  tone = 'primary',
  loading,
  error,
  onClose,
  onConfirm,
  children,
}: {
  visible: boolean;
  title: string;
  message?: string;
  reasons?: Option[];
  showNote?: boolean;
  noteRequired?: boolean;
  noteMax?: number;
  notePlaceholder?: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string, note: string) => void;
  children?: ReactNode;
}) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setReason('');
      setNote('');
    }
  }, [visible]);

  const needsOther = reason === 'other';
  const ready = (!reasons || !!reason) && (!noteRequired || !!note.trim()) && (!needsOther || !!note.trim());

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      footer={
        <Button
          label={confirmLabel}
          variant={tone === 'danger' ? 'danger' : 'primary'}
          onPress={() => onConfirm(reason, note.trim())}
          disabled={!ready}
          loading={loading}
          full
          size="lg"
        />
      }
    >
      {message ? (
        <Txt v="body" tone="soft">
          {message}
        </Txt>
      ) : null}
      {children}
      {reasons ? (
        <View style={{ gap: 8 }}>
          <Txt v="label" tone="soft">
            Reason
          </Txt>
          {reasons.map((r) => (
            <Radio key={r.value} label={r.label} selected={reason === r.value} onPress={() => setReason(r.value)} />
          ))}
        </View>
      ) : null}
      {showNote ? (
        <Field
          label={noteRequired || needsOther ? 'Details' : 'Note'}
          optional={!noteRequired && !needsOther}
          value={note}
          onChangeText={setNote}
          placeholder={notePlaceholder}
          multiline
          maxLength={noteMax}
        />
      ) : null}
      {error ? <Notice tone="danger" body={error} /> : null}
    </Sheet>
  );
}
