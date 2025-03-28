import React from "react";
import AdminLayout from "../../components/layouts/admin/layout";
import { Row, Col, Card, Typography, Space, Table, Progress, Tag, Avatar, Timeline, Statistic } from 'antd';
import { UserOutlined, BookOutlined, TeamOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { BarChart } from '@mui/x-charts/BarChart';

const content = (
  <div style={{ padding: '24px' }}>
    <Row gutter={[16, 16]}>
      {/* Thống kê tổng quan */}
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Tổng số học viên"
            value={1500}
            prefix={<UserOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Tổng số giảng viên"
            value={50}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Khóa học đang mở"
            value={25}
            prefix={<BookOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Buổi học hoàn thành"
            value={328}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>

      {/* Biểu đồ thống kê */}
      <Col xs={24} lg={16}>
        <Card title="Thống kê khóa học theo tháng">
          <BarChart
            xAxis={[{ 
              scaleType: 'band', 
              data: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'] 
            }]}
            series={[
              { data: [4, 3, 5, 7, 8, 6], label: 'Khóa học mới' },
              { data: [2, 4, 3, 5, 4, 7], label: 'Khóa học hoàn thành' }
            ]}
            height={300}
          />
        </Card>
      </Col>

      {/* Timeline hoạt động */}
      <Col xs={24} lg={8}>
        <Card title="Hoạt động gần đây">
          <Timeline
            items={[
              {
                color: 'green',
                children: (
                  <>
                    <Typography.Text strong>Khóa học mới được tạo</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">2 giờ trước</Typography.Text>
                  </>
                ),
              },
              {
                color: 'blue',
                children: (
                  <>
                    <Typography.Text strong>5 học viên đăng ký mới</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">3 giờ trước</Typography.Text>
                  </>
                ),
              },
              {
                color: 'red',
                children: (
                  <>
                    <Typography.Text strong>Buổi học bị hủy</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">5 giờ trước</Typography.Text>
                  </>
                ),
              },
            ]}
          />
        </Card>
      </Col>

      {/* Bảng danh sách học viên */}
      <Col span={24}>
        <Card title="Danh sách học viên">
          <Table 
            columns={[
              {
                title: 'Học viên',
                dataIndex: 'avatar',
                key: 'avatar',
              },
              {
                title: 'Tên',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
              },
              {
                title: 'Khoa',
                dataIndex: 'department',
                key: 'department',
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
              },
              {
                title: 'Tiến độ',
                dataIndex: 'progress',
                key: 'progress',
              },
            ]} 
            dataSource={[
              {
                key: '1',
                name: 'Nguyễn Văn A',
                email: 'nguyenvana@example.com',
                department: 'CNTT',
                status: <Tag color="success">Đang học</Tag>,
                progress: <Progress percent={70} size="small" />,
                avatar: <Avatar src="https://i.pravatar.cc/150?img=1" />
              },
              {
                key: '2',
                name: 'Trần Thị B',
                email: 'tranthib@example.com',
                department: 'CNTT',
                status: <Tag color="processing">Đang chờ</Tag>,
                progress: <Progress percent={30} size="small" />,
                avatar: <Avatar src="https://i.pravatar.cc/150?img=2" />
              },
            ]}
            pagination={{ pageSize: 5 }}
          />
        </Card>
      </Col>
    </Row>
  </div>
);

const Dashboard = () => {
  return (
    <AdminLayout title="Dashboard" children={content} />
  );
};

export default Dashboard;