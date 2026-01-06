'use client'

import { useState } from 'react'
import { Admin, Resource, List, Datagrid, DatagridConfigurable, TextField, ShowGuesser, useRecordContext, FunctionField, TopToolbar, useListContext, SelectColumnsButton } from 'react-admin'
import jsonServerProvider from 'ra-data-json-server'
import { IconButton, Tooltip, Button, Menu, MenuItem, Box, CircularProgress } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import PullToRefresh from 'react-simple-pull-to-refresh'

const dataProvider = jsonServerProvider('/api')

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  // const y = d.getFullYear()
  // const m = String(d.getMonth() + 1).padStart(2, '0')
  // const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${h}:${min}:${s}`
}

const CopyableTextField = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record || !record[source]) return null

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(record[source])
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span>{record[source]}</span>
      <Tooltip title="Copy">
        <IconButton onClick={handleCopy} size="small" style={{ marginLeft: 8 }}>
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  )
}

const authProvider = {
  login: async ({ username, password }: { username: string; password: string }) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) throw new Error('login failed')
    return Promise.resolve()
  },
  logout: async () => {
    await fetch('/api/logout', { method: 'POST' })
    return Promise.resolve()
  },
  checkAuth: async () => {
    const res = await fetch('/api/auth/check')
    if (!res.ok) throw new Error('unauthorized')
    return Promise.resolve()
  },
  checkError: async (error: any) => {
    if (error && error.status === 401) {
      throw new Error('unauthorized')
    }
    return Promise.resolve()
  },
  getPermissions: async () => Promise.resolve(),
}

const AutoRefreshMenu = ({ interval, setInterval }: { interval: number; setInterval: (v: number) => void }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  
  const handleClose = (newInterval?: number) => {
    setAnchorEl(null)
    if (newInterval !== undefined) {
      setInterval(newInterval)
    }
  }

  return (
    <>
      <span>自动刷新间隔</span>
      <Button
        color="primary"
        onClick={handleClick}
        startIcon={<AutorenewIcon />}
        endIcon={<ArrowDropDownIcon />}
        size="small"
      >
        {interval ? `${interval / 1000}s` : 'Off'}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={() => handleClose()}>
        <MenuItem onClick={() => handleClose(0)}>Off</MenuItem>
        <MenuItem onClick={() => handleClose(5000)}>5s</MenuItem>
        <MenuItem onClick={() => handleClose(10000)}>10s</MenuItem>
        <MenuItem onClick={() => handleClose(30000)}>30s</MenuItem>
        <MenuItem onClick={() => handleClose(60000)}>60s</MenuItem>
      </Menu>
    </>
  )
}

const MessagesListActions = ({ interval, setInterval }: { interval: number; setInterval: (v: number) => void }) => (
  <TopToolbar>
    <AutoRefreshMenu interval={interval} setInterval={setInterval} />
    <SelectColumnsButton size="small" />
  </TopToolbar>
)

const PullToRefreshWrapper = ({ children }: { children: React.ReactNode }) => {
  const { refetch } = useListContext()
  return (
    <PullToRefresh
      onRefresh={async () => refetch()}
      pullingContent={
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      }
      refreshingContent={
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      }
    >
      <Box sx={{ minHeight: '80vh' }}>{children}</Box>
    </PullToRefresh>
  )
}

function MessagesList() {
  const [interval, setInterval] = useState(10000)

  return (
    <List 
      exporter={false} 
      actions={<MessagesListActions interval={interval} setInterval={setInterval} />}
      queryOptions={{ refetchInterval: interval }}
    >
      <PullToRefreshWrapper>
        <DatagridConfigurable rowClick="show" bulkActionButtons={false}>
          <TextField source="to" sortable={false} />
          <CopyableTextField source="code" />
          <TextField source="content" sortable={false} />
          <FunctionField
            source="timestamp"
            render={(record: any) => formatDate(record.timestamp)}
            sortable={false}
          />
        </DatagridConfigurable>
      </PullToRefreshWrapper>
    </List>
  )
}

export default function AdminApp() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider}>
      <Resource name="messages" list={MessagesList} />
    </Admin>
  )
}

