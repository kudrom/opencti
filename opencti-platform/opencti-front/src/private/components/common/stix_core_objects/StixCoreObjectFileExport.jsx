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


const useStyles = makeStyles((theme) => ({
    drawerPaper: {
        minHeight: '100vh',
        width: '50%',
        position: 'fixed',
        padding: 0,
    },
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
               <div style={{ float: 'left', marginTop: -15 }}>
                   <Tooltip
                       title={
                           isExportPossible
                               ? t('Generate an export')
                               : t('No export connector available to generate an export')
                       }
                       aria-label="generate-export"
                   >
            <span>
              <IconButton
                  onClick={handleOpenExport}
                  disabled={!isExportPossible}
                  aria-haspopup="true"
                  color="primary"
                  size="medium"
              >
                <FileExportOutline />
              </IconButton>
            </span>
                   </Tooltip>
               </div>
               <div className="clearfix" />
               <Paper classes={{ root: classes.paper }} variant="outlined">
                   {exportFiles?.edges?.length ? (
                       <List>
                           {exportFiles.edges.map((file) => {
                               return (
                                   file?.node && (
                                       <FileLine
                                           key={file?.node.id}
                                           file={file?.node}
                                           dense={true}
                                           disableImport={true}
                                       />
                                   )
                               );
                           })}
                       </List>
                   ) : (
                       <div style={{ display: 'table', height: '100%', width: '100%' }}>

                       </div>
                   )}
               </Paper>
           </div>

        );
}

export default StixCoreObjectFileExport;