import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import React, { FunctionComponent } from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { IndicatorDetails_indicator$data } from '@components/observations/indicators/__generated__/IndicatorDetails_indicator.graphql';
import { useFormatter } from '../../../../components/i18n';

interface DecayDialogContentProps {
  indicator: IndicatorDetails_indicator$data,
}

const DecayDialogContent : FunctionComponent<DecayDialogContentProps> = ({ indicator }) => {
  const { t, fldt } = useFormatter();
  const series = [{ name: 'Live score', data: [100, 80, 60, 40, 20, 0], type: 'line' }];
  const chartOptions: ApexOptions = {
    chart: { id: 'Decay graph' },
    xaxis: { type: 'datetime' },
    yaxis: { min: 0, max: 100 },
  };

  console.log('indicator:', indicator);

  const decayHistory = indicator.x_opencti_decay_history ?? [];
  const decayReactionPoints = indicator.x_opencti_decay_rule?.decay_points ?? [];

  /* const decayHistory2 = [
    { updated_at: new Date(), score: 100 },
    { updated_at: new Date(), score: 80 },
  ]; */
  return (
    <DialogContent>
      <Typography variant="h2">
        {t('Lifecycle details')}
      </Typography>
      <Grid
        container={true}
        spacing={3}
        style={{ borderColor: 'white', borderWidth: 1 }}
      >
        <Grid item={true} xs={6}>
          <DialogContentText>
            {t('Soon... a nice chart here.')}
          </DialogContentText>
          <Chart
            series={series}
            options={chartOptions}
            type="line"
            width="500"
          />
        </Grid>
        <Grid item={true} xs={6}>
          <Typography variant="h2">
            {t('Applied decay rule:')}
          </Typography>
          <DialogContentText>
            {t('Base score:')} { indicator.x_opencti_base_score }
          </DialogContentText>
          <DialogContentText>
            {t('Lifetime (days):')} { indicator.x_opencti_decay_rule?.decay_lifetime ?? 'Not set'}
          </DialogContentText>
          <DialogContentText>
            {t('Pound factor:')} { indicator.x_opencti_decay_rule?.decay_pound ?? 'Not set'}
          </DialogContentText>
          <DialogContentText>
            {t('Revoke score:')} { indicator.x_opencti_decay_rule?.decay_revoke_score ?? 'Not set'}
          </DialogContentText>
          <DialogContentText>
            {t('Reaction points:')} { decayReactionPoints.map((point) => (
              ` ${point}`
            ))}
          </DialogContentText>
          <TableContainer component={Paper}>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>{t('Date')}</TableCell>
                  <TableCell>{t('Score')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {decayHistory.map((history) => (
                  <TableRow key={ decayHistory.indexOf(history)}>
                    <TableCell>{fldt(history.updated_at)}</TableCell>
                    <TableCell>{history.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </DialogContent>
  );
};

/*
                {decayHistory.map((history) => (
                  <TableRow key={ history.updated_at.getTime() }>
                    <TableCell>{fldt(history.updated_at)}</TableCell>
                    <TableCell>{history.score}</TableCell>
                  </TableRow>
                ))}
 */

export default DecayDialogContent;
