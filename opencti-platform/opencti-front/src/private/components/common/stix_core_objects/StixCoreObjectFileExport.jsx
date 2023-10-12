import React, {useState} from 'react';
import FileExportViewer from "@components/common/files/FileExportViewer";
import Drawer from "@mui/material/Drawer";
import makeStyles from "@mui/styles/makeStyles";
import {stixCoreObjectsExportsContentQuery} from "@components/common/stix_core_objects/StixCoreObjectsExportsContent";
import {QueryRenderer} from "../../../../relay/environment";
import relay from "vite-plugin-relay";
import {filter} from "ramda";
import {Value} from "classnames";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import {FileExportOutline} from "mdi-material-ui";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import FileLine from "@components/common/files/FileLine";
import {useFormatter} from "../../../../components/i18n";
import {AccountBalanceOutlined} from "@mui/icons-material";
import {truncate} from "../../../../utils/String";
import Chip from "@mui/material/Chip";
import ToggleButton from "@mui/material/ToggleButton";
import {DialogTitle} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import {Formik} from "formik";


const useStyles = makeStyles((theme) => ({

}));


const StixCoreObjectFileExport = ({  entity }) => {
    console.log('StixCoreObjectFileExport', StixCoreObjectFileExport)
    const classes = useStyles();
    const { t } = useFormatter();
    const isExportPossible = true; // TODO changeMe
    const [displayFileExport, setFileExport] = useState(false);
    const handleOpenExport = () => setFileExport(true);
    const handleCloseExport = () => setFileExport(false);

    const { id, exportFiles } = entity;

    return (
           <div>
               <div>
                   <Tooltip
                       title={
                           isExportPossible
                               ? t('Generate an export')
                               : t('No export connector available to generate an export')
                       }
                       aria-label="generate-export"
                   >
                       <ToggleButton
                          onClick={handleOpenExport}
                          disabled={!isExportPossible}
                          value="quick-export"
                          aria-haspopup="true"
                          color="primary"
                          size="small"
                          style={{ marginRight: 3 }}
                      >
                            <FileExportOutline
                                fontSize="small"
                                color= "primary"
                            />
                       </ToggleButton>
                   </Tooltip>
                       <Dialog onClose={handleCloseExport}>
                           <DialogTitle>{t('Generate an export')}</DialogTitle>
                       </Dialog>
               </div>
           </div>

        );
}

export default StixCoreObjectFileExport;