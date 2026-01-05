'use client'

import { Admin, Resource, List, Datagrid, TextField, ShowGuesser, useRecordContext, FunctionField } from 'react-admin'
import jsonServerProvider from 'ra-data-json-server'
import { IconButton, Tooltip } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

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
  login: async ({ password }: { password: string }) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
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

function MessagesList() {
  return (
    <List exporter={false}>
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="to" sortable={false} />
        <CopyableTextField source="code" />
        <TextField source="content" sortable={false} />
        <FunctionField
          source="timestamp"
          render={(record: any) => formatDate(record.timestamp)}
          sortable={false}
        />
      </Datagrid>
    </List>
  )
}

export default function AdminApp() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider}>
      <Resource name="messages" list={MessagesList} show={ShowGuesser} />
    </Admin>
  )
}

