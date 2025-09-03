# WebSocket Integration for Real-time Job Logs

This document describes the WebSocket integration that provides real-time updates for job logs in the TriggerX frontend application.

## Overview

The WebSocket integration replaces traditional API polling with real-time WebSocket connections, providing instant updates when job tasks are created, updated, or their status changes.

## Features

- **Real-time Updates**: Instant notifications for task data changes
- **Automatic Fallback**: Falls back to API calls if WebSocket is unavailable
- **Connection Status**: Visual indicators showing connection state
- **Room-based Subscriptions**: Subscribe to specific job rooms for targeted updates
- **Error Handling**: Graceful error handling and reconnection logic

## Components

### 1. useWebSocket Hook (`src/hooks/useWebSocket.ts`)

A generic WebSocket hook that provides:

- Connection management
- Automatic reconnection
- Message handling
- Error handling
- Room subscription/unsubscription

```typescript
import { useWebSocket } from "@/hooks/useWebSocket";

const { isConnected, isConnecting, error, subscribe, unsubscribe } =
  useWebSocket("ws://192.168.1.38:9002/api/ws/tasks?api_key=YOUR_API_KEY", {
    onMessage: handleMessage,
    onError: handleError,
    autoReconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
  });
```

### 2. useJobLogsHybrid Hook (`src/hooks/useJobLogsHybrid.ts`)

A hybrid hook that combines WebSocket real-time updates with API fallback:

```typescript
import { useJobLogsHybrid } from "@/hooks/useJobLogsHybrid";

const { logs, loading, error, isConnected, isConnecting, useWebSocketMode } =
  useJobLogsHybrid(jobId);
```

**Features:**

- Automatically connects to WebSocket for real-time updates
- Falls back to API calls if WebSocket is unavailable
- Handles task creation, updates, status changes, and fee updates
- Provides connection status information

### 3. WebSocketStatus Component (`src/components/common/WebSocketStatus.tsx`)

A reusable component that displays connection status:

```typescript
import { WebSocketStatus } from "@/components/common/WebSocketStatus";

<WebSocketStatus
  isConnected={isConnected}
  isConnecting={isConnecting}
  useWebSocketMode={useWebSocketMode}
/>
```

**Status Indicators:**

- 🟢 **Live**: WebSocket connected and receiving real-time updates
- 🟡 **Connecting...**: Attempting to establish WebSocket connection
- 🔴 **Offline**: WebSocket disconnected or failed to connect
- ⚪ **API Mode**: Using API fallback instead of WebSocket

## Usage

### Basic Implementation

Replace the existing `useJobLogs` hook with `useJobLogsHybrid`:

```typescript
// Before
import { useJobLogs } from "@/hooks/useJobLogs";
const { logs, loading, error } = useJobLogs(jobId);

// After
import { useJobLogsHybrid } from "@/hooks/useJobLogsHybrid";
const { logs, loading, error, isConnected, isConnecting, useWebSocketMode } =
  useJobLogsHybrid(jobId);
```

### Update JobLogsTable Component

Add connection status to your JobLogsTable component:

```typescript
import { WebSocketStatus } from "@/components/common/WebSocketStatus";

interface JobLogsTableProps {
  logs: JobLog[];
  error?: string;
  isConnected?: boolean;
  isConnecting?: boolean;
  useWebSocketMode?: boolean;
}

const JobLogsTable: React.FC<JobLogsTableProps> = ({
  logs,
  error,
  isConnected,
  isConnecting,
  useWebSocketMode
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h3" color="primary">
          Job Logs
        </Typography>
        <WebSocketStatus
          isConnected={isConnected}
          isConnecting={isConnecting}
          useWebSocketMode={useWebSocketMode}
        />
      </div>
      {/* Rest of your table implementation */}
    </div>
  );
};
```

### Example Implementation

See `src/components/examples/WebSocketExample.tsx` for a complete example:

```typescript
import { WebSocketExample } from "@/components/examples/WebSocketExample";

<WebSocketExample jobId={123} />
```

## WebSocket Message Types

The system handles the following WebSocket message types:

### Incoming Messages (Server to Client)

1. **TASK_CREATED**: New task created
2. **TASK_UPDATED**: Task execution/attestation data updated
3. **TASK_STATUS_CHANGED**: Task status changes
4. **TASK_FEE_UPDATED**: Task fee changes
5. **ERROR**: WebSocket error messages

### Message Format

```typescript
interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface TaskUpdateData {
  task_id: number;
  job_id: string;
  user_id: string;
  changes: Partial<JobLog>;
  timestamp: string;
}
```

## Configuration

### Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.38:9002
NEXT_PUBLIC_API_KEY=your_api_key_here
NEXT_PUBLIC_WEBSOCKET_URL=ws://192.168.1.38:9002/api/ws/tasks
```

### WebSocket URL Configuration

The WebSocket URL is now configured directly via environment variable:

```typescript
// WebSocket URL is read from environment variable
const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
return WS_URL; // e.g., "ws://192.168.1.38:9002/api/ws/tasks"
```

## Fallback Behavior

The hybrid approach ensures reliability:

1. **Initial Connection**: Attempts WebSocket connection first
2. **Timeout Fallback**: If no WebSocket data received within 10 seconds, falls back to API
3. **Error Fallback**: If WebSocket connection fails, immediately falls back to API
4. **Reconnection**: Attempts to reconnect WebSocket in background
5. **Seamless Transition**: Users see no interruption in data flow

## Error Handling

### Common Error Scenarios

1. **WebSocket Connection Failed**
   - Automatically falls back to API calls
   - Shows "API Mode" status indicator

2. **Authentication Failed**
   - Displays error message
   - Falls back to API calls

3. **Network Issues**
   - Automatic reconnection attempts
   - Graceful degradation to API mode

### Error Recovery

- **Automatic Reconnection**: Attempts to reconnect every 5 seconds
- **Maximum Retries**: Limits reconnection attempts to prevent infinite loops
- **User Feedback**: Clear status indicators show current connection state

## Performance Considerations

### Benefits

- **Reduced API Calls**: Eliminates polling, reducing server load
- **Real-time Updates**: Instant notification of changes
- **Better UX**: Users see updates immediately without refresh

### Considerations

- **Connection Overhead**: WebSocket connections consume resources
- **Browser Limits**: Some browsers limit concurrent WebSocket connections
- **Network Stability**: Requires stable network connection for optimal performance

## Testing

### Manual Testing

1. **Connection Test**: Check if WebSocket connects successfully
2. **Fallback Test**: Disconnect WebSocket to test API fallback
3. **Real-time Test**: Create/update tasks to verify real-time updates
4. **Error Test**: Test error handling and recovery

### Development Tools

Use browser developer tools to monitor WebSocket connections:

```javascript
// In browser console
// Monitor WebSocket messages
const ws = new WebSocket(
  "ws://192.168.1.38:9002/api/ws/tasks?api_key=YOUR_API_KEY",
);
ws.onmessage = (event) =>
  console.log("WebSocket message:", JSON.parse(event.data));
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Refused**
   - Check if WebSocket server is running
   - Verify API base URL configuration
   - Check firewall settings

2. **Authentication Errors**
   - Verify API key is valid
   - Check API key permissions

3. **No Real-time Updates**
   - Check WebSocket connection status
   - Verify room subscription
   - Check server-side event emission

### Debug Mode

Enable debug logging to see detailed WebSocket activity:

```typescript
// Check browser console for detailed logs
// Look for "WebSocket connected", "WebSocket message received", etc.
```

## Migration Guide

### From useJobLogs to useJobLogsHybrid

1. **Update Imports**

   ```typescript
   // Replace
   import { useJobLogs } from "@/hooks/useJobLogs";

   // With
   import { useJobLogsHybrid } from "@/hooks/useJobLogsHybrid";
   ```

2. **Update Hook Usage**

   ```typescript
   // Replace
   const { logs, loading, error } = useJobLogs(jobId);

   // With
   const { logs, loading, error, isConnected, isConnecting, useWebSocketMode } =
     useJobLogsHybrid(jobId);
   ```

3. **Add Status Indicators**

   ```typescript
   // Add WebSocketStatus component to your UI
   <WebSocketStatus
     isConnected={isConnected}
     isConnecting={isConnecting}
     useWebSocketMode={useWebSocketMode}
   />
   ```

4. **Update Component Props**
   ```typescript
   // Add new props to JobLogsTable
   interface JobLogsTableProps {
     logs: JobLog[];
     error?: string;
     isConnected?: boolean;
     isConnecting?: boolean;
     useWebSocketMode?: boolean;
   }
   ```

## Future Enhancements

- **Connection Pooling**: Optimize multiple WebSocket connections
- **Message Queuing**: Handle offline scenarios with message queuing
- **Compression**: Add message compression for large datasets
- **Metrics**: Add connection metrics and monitoring
- **Custom Events**: Support for custom WebSocket event types
