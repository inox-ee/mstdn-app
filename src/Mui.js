import React from 'react'
import AppBar from '@material-ui/core/AppBar'
import ToolBar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'

export const SimpleAppBar = () => {
  return (
    <div/*flexGrow="1"*/>
      <AppBar position="static" color="primary">
        <ToolBar>
          <Typography variant="h1" color="inherit">
            Mastodon Client
          </Typography>
        </ToolBar>
      </AppBar>
    </div>
  )
}

export const SimpleTextField = () => {
  return (
    <TextField
      label="New Toot"
      multiline
      rows="4"
      variant="outlined"/>
  )
}

export const SimpleButton = () => {
  return (
    <Button variant="raised" color="secondary">Toot</Button>
  )
}