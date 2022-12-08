import {Dialog} from "@material-ui/core";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import TracksManager from "../../context/TracksManager";
import DialogActions from "@mui/material/DialogActions";
import {Button} from "@mui/material";
import React, {useContext} from "react";
import AppContext from "../../context/AppContext";

export default function DeleteFavoriteDialog({dialogOpen, setDialogOpen}) {

    const ctx = useContext(AppContext);

    const toggleShowDialog = () => {
        setDialogOpen(!dialogOpen);
    };

    function deleteFavorite() {
        for (let i = 0; i < ctx.selectedGpxFile.file.wpts.length; i++) {
            if (ctx.selectedGpxFile.file.wpts[i].name === ctx.selectedGpxFile.markerCurrent.title) {
                ctx.selectedGpxFile.file.wpts.splice(i, 1);
                ctx.selectedGpxFile.markerPrev = ctx.selectedGpxFile.markerCurrent;
                delete ctx.selectedGpxFile.markerCurrent;
                ctx.selectedGpxFile.editFavorite = true;
                TracksManager.saveTrack(ctx, ctx.selectedGpxFile.file.name, ctx.selectedGpxFile.name, TracksManager.FAVORITE_FILE_TYPE);
                ctx.setSelectedGpxFile({...ctx.selectedGpxFile});
                ctx.setFavorites({...ctx.favorites});
                setDialogOpen(false);
                ctx.setCurrentObjectType(null);
                break;
            }
        }
    }

    return (
        <Dialog open={true} onClose={toggleShowDialog}>
            <DialogTitle>Delete favorite</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {`Are you sure you want to delete ${TracksManager.prepareName(ctx.selectedGpxFile.markerCurrent.title)}?`}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => deleteFavorite()}>
                    Delete</Button>
                <Button onClick={toggleShowDialog}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}