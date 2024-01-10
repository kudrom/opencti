import React, { FunctionComponent } from 'react';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/styles';
import { Theme } from '@mui/material/styles/createTheme';
import { IndicatorDetails_indicator$data } from '@components/observations/indicators/__generated__/IndicatorDetails_indicator.graphql';
import { useFormatter } from '../../../../components/i18n';

interface DecayDialogContentProps {
  indicator: IndicatorDetails_indicator$data,
}

const DecayDialogContent : FunctionComponent<DecayDialogContentProps> = ({ indicator }) => {
  const theme = useTheme<Theme>();
  const { t, fldt } = useFormatter();
  /* const series = [{ name: 'Live score', data: [100, 80, 60, 40, 20, 0], type: 'line' }];
  const chartOptions: ApexOptions = {
    chart: { id: 'Decay graph' },
    xaxis: { type: 'datetime' },
    yaxis: { min: 0, max: 100 },
  }; */

  const decayHistory = indicator.x_opencti_decay_history ? [...indicator.x_opencti_decay_history] : [];
  decayHistory.sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
  const decayReactionPoints = indicator.x_opencti_decay_rule?.decay_points ?? [];
  const currentScoreLineStyle = {
    color: theme.palette.success.main,
    fontWeight: 'bold',
  };
  return (
    <DialogContent>
      <Grid
        container={true}
        spacing={3}
        style={{ borderColor: 'white', borderWidth: 1 }}
      >
        <Grid item={true} xs={6}>
          <Typography variant="h6">
            {t('Lifecycle key information')}
          </Typography>
          <TableContainer component={Paper}>
            <Table sx={{ maxHeight: 440 }} size="small" aria-label="lifecycle history">
              <TableHead>
                <TableRow>
                  <TableCell>{t('Score')}</TableCell>
                  <TableCell>{t('Date')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {decayHistory.map((history, index) => (
                  <TableRow key={index}>
                    <TableCell sx={index === 0 ? currentScoreLineStyle : {}}>{history.score}</TableCell>
                    <TableCell sx={index === 0 ? currentScoreLineStyle : {}}>{fldt(history.updated_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item={true} xs={6}>
          <Typography variant="h6">
            {t('Applied decay rule')}
          </Typography>
          <ul>
            <li>{t('Base score:')} { indicator.x_opencti_base_score }</li>
            <li>{t('Lifetime (in days):')} { indicator.x_opencti_decay_rule?.decay_lifetime ?? 'Not set'}</li>
            <li>{t('Pound factor:')} { indicator.x_opencti_decay_rule?.decay_pound ?? 'Not set'}</li>
            <li>{t('Revoke score:')} { indicator.x_opencti_decay_rule?.decay_revoke_score ?? 'Not set'}</li>
            <li>{t('Reaction points:')} {decayReactionPoints.join(', ')}</li>
          </ul>
        </Grid>
      </Grid>
    </DialogContent>
  );
};

export default DecayDialogContent;
