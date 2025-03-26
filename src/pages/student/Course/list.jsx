import React from "react";
import { Layout, Card, Input, Button, Tabs, Typography } from "antd";
import { UploadOutlined, LinkOutlined, FileTextOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ClassworkPage = () => {
  return (
    <Layout style={{ minHeight: "100vh", background: "#fff" }}>
      <Header style={{ background: "#fff", borderBottom: "1px solid #ddd" }}>
        <Tabs defaultActiveKey="1" centered>
          <TabPane tab={<b>Classwork</b>} key="1" />
          <TabPane tab={<b>People</b>} key="2" />
        </Tabs>
      </Header>

      <Content style={{ padding: "20px 10%" }}>
        {/* Announcement Input */}
        <Card>
          <Title level={5}>Announce something to your class</Title>
          <Input.TextArea rows={2} placeholder="Announce something to your class" />
          <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
            <div>
              <Button icon={<FileTextOutlined />} type="text" />
              <Button icon={<LinkOutlined />} type="text" />
              <Button icon={<UploadOutlined />} type="text" />
            </div>
            <Button type="primary">Post</Button>
          </div>
        </Card>

        {/* Homework Section */}
        <div style={{ display: "flex", marginTop: 20 }}>
          <Card title="Home work" style={{ width: 200, marginRight: 20 }}>
            <a href="#">View all</a>
          </Card>

          <div style={{ flex: 1 }}>
            {/* List of Assignments */}
            <Card>
              <Title level={5}>Title</Title>
              <Text>Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very very short story.</Text>
            </Card>

            <Card style={{ marginTop: 10 }}>
              <Title level={5}>Title</Title>
              <Text>Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very very short story.</Text>
            </Card>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default ClassworkPage;
