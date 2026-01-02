export function callRecordingPrefix(opts: { orgId: string; callId: string; recordingId: string }) {
  return `org/${opts.orgId}/calls/${opts.callId}/recording/${opts.recordingId}`
}

export function callRecordingObjectKey(opts: {
  orgId: string
  callId: string
  recordingId: string
  filename: string
}) {
  return `${callRecordingPrefix(opts)}/${opts.filename}`
}

