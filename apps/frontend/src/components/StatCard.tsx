import { Card, CardContent, Typography } from '@mui/material';

interface StatCardProps {
  title: string;
  value: number | string;
}

export function StatCard({ title, value }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h3" fontWeight={700}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
