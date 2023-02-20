import React, {useContext, useState} from 'react';
import {Dialog} from "@material-ui/core";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import {
    Alert,
    Autocomplete,
    Button,
    createFilterOptions,
    TextField
} from "@mui/material";
import AppContext from "../../../context/AppContext";
import TracksManager from "../../../context/TracksManager";
import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";


export default function SaveTrackDialog() {

    const ctx = useContext(AppContext);

    const [folder, setFolder] = useState("Tracks");
    const [fileName, setFileName] = useState(ctx.selectedGpxFile.name);
    const [dialogOpen, setDialogOpen] = useState(ctx.selectedGpxFile.save);
    const [error, setError] = useState(false);
    const [existError, setExistError] = useState(false);
    const [existTrack, setExistTrack] = useState(false);

    let folders = ctx.gpxFiles.trackGroups.map(group => (
            {
                title: group.name
            }
        )
    );

    const toggleShowDialog = () => {
        setDialogOpen(!dialogOpen);
        ctx.selectedGpxFile.save = !ctx.selectedGpxFile.save;
        ctx.selectedGpxFile.clear = true;
        ctx.setSelectedGpxFile({...ctx.selectedGpxFile});
    };

    const getFolderName = (folder) => {
        if (folder === null) {
            return null;
        } else {
            if (typeof folder === 'string') {
                return folder;
            }
            if (folder.inputValue) {
                return folder.inputValue;
            }
            return folder.title;
        }
    }

    const filter = createFilterOptions();

    async function saveTrack() {
        if (validName(fileName)) {
            if (!hasExistTrack(fileName, folder)) {
                await TracksManager.saveTrack(ctx, getFolderName(folder), fileName, TracksManager.GPX_FILE_TYPE);
                toggleShowDialog();
            } else {
                setExistTrack(true);
            }
        } else {
            setError(true);
        }
    }

    function validName(fileName) {
        return fileName !== "" && fileName.trim().length > 0;
    }

    function hasExistTrack(fileName, folder) {
        let selectedGroup = ctx.gpxFiles.trackGroups.find(g => {
            if (folder.title) {
                return g.name === folder.title;
            } else {
                return g.name === folder;
            }
        });
        return selectedGroup.files.find(f => TracksManager.prepareName(f.name) === fileName);
    }

    const DialogUpdateTrack = ({open, close}) => {
        return (
            <Dialog open={open} onClose={close}>
                <DialogContentText sx={{margin: "10px"}}>
                    {`Do you want to update the track?`}
                </DialogContentText>
                <DialogActions>
                    <Button onClick={() => {
                        setExistError(true);
                        setExistTrack(false);
                    }}>No</Button>
                    <Button onClick={() => {
                        setExistTrack(false);
                        TracksManager.saveTrack(ctx, getFolderName(folder), fileName, TracksManager.GPX_FILE_TYPE).then();
                    }}>Yes</Button>
                </DialogActions>
            </Dialog>
        )
    }


    return (
        <div>
            <Dialog open={true} onClose={toggleShowDialog}>
                <DialogUpdateTrack open={existTrack} onClose={!existTrack}/>
                <DialogTitle>Save track</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {`Are you sure you want to save the track to the cloud tracks?`}
                    </DialogContentText>
                    {error && <Alert onClose={() => {
                        setError(false)
                    }} severity="warning">You tried to save the wrong name!</Alert>}
                    {existError && <Alert onClose={() => {
                        setExistError(false)
                    }} severity="warning">Select other name!</Alert>}
                    <TextField
                        autoFocus
                        margin="dense"
                        onChange={(e) => {
                            setFileName(e.target.value);
                        }}
                        label="Name"
                        id="fileName"
                        type="fileName"
                        fullWidth
                        error={fileName === ""}
                        helperText={fileName === "" ? 'Empty name!' : ' '}
                        variant="standard"
                        value={fileName ? fileName : ''}
                    >
                    </TextField>
                    <Autocomplete
                        value={folder}
                        onChange={(event, newValue) => {
                            setFolder(newValue);
                        }}
                        filterOptions={(options, params) => {
                            const filtered = filter(options, params);
                            const {inputValue} = params;
                            const isExisting = options.some((option) => inputValue === option.title);
                            if (inputValue !== '' && !isExisting) {
                                filtered.push({
                                    inputValue,
                                    title: `Add "${inputValue}"`,
                                });
                            }
                            return filtered;
                        }}
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                        id="folder"
                        options={folders}
                        getOptionLabel={(option) => getFolderName(option)}
                        renderOption={(props, option) => <li {...props}>{option.title}</li>}
                        freeSolo
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Folder"
                                error={folder == null}
                                helperText={folder == null ? 'Empty folder!' : ' '}/>
                        )}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={toggleShowDialog}>Cancel</Button>
                    <Button disabled={getFolderName(folder) === null || fileName === "" || error}
                            onClick={() => saveTrack()}>
                        Save</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}