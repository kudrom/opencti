import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import React from 'react';
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
import { useFormatter } from '../../../../components/i18n';

const DecayDialogContent = () => {
  const { t, fldt } = useFormatter();
  const series = [{ name: 'Live score', data: [100, 80, 60, 40, 20, 0], type: 'line' }];
  const chartOptions: ApexOptions = {
    chart: { id: 'Decay graph' },
    xaxis: { type: 'datetime' },
    yaxis: { min: 0, max: 100 },
  };

  const decayHistory2 = [
    { updated_at: new Date(), score: 100 },
    { updated_at: new Date(), score: 80 },
  ];
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
          <DialogContentText>
            {t('Soon... a nice table here.')}
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

              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </DialogContent>
  );
};

/*

                {decayHistory2.map((history) => (
                  <TableRow key={history.updated_at.getTime()}>
                    <TableCell>{fldt(history.updated_at)}</TableCell>
                    <TableCell>{history.score}</TableCell>
                  </TableRow>
                ))}
 */

export default DecayDialogContent;
