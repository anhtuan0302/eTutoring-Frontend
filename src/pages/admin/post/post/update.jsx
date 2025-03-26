import React, { useState, useEffect, useCallback } from "react";
import { Form, Input, Select, Button, Upload, message, List } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getPostById, updatePost } from "../../../../api/post/post";
import { getPostCategory } from "../../../../api/post/postCategory";
import { 
  uploadPostFile, 
  getFilesByPostId, 
  deleteFile 
} from "../../../../api/post/postFile";

const { TextArea } = Input;

const UpdatePost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch post data
      const postData = await getPostById(id);
      
      // Fetch categories
      const categoriesData = await getPostCategory();
      
      // Fetch existing files
      const filesData = await getFilesByPostId(id);

      // Set form values
      form.setFieldsValue({
        title: postData.title,
        content: postData.content,
        post_category_id: postData.post_category_id,
        status: postData.status || 'active'
      });

      setCategories(categoriesData);
      setExistingFiles(filesData);
    } catch (error) {
      message.error("Không thể tải thông tin bài viết");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [id, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      // Update post information
      await updatePost({
        _id: id,
        title: values.title,
        content: values.content,
        post_category_id: values.post_category_id,
        status: values.status
      });

      // Handle new file uploads
      if (fileList.length > 0) {
        const formData = new FormData();
        fileList.forEach(file => {
          formData.append('files', file.originFileObj);
        });
        formData.append('post_id', id);
        await uploadPostFile(formData);
      }

      message.success("Cập nhật bài viết thành công");
      navigate("/admin/post");
    } catch (error) {
      message.error("Lỗi khi cập nhật bài viết");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await deleteFile(fileId);
      setExistingFiles(prev => prev.filter(file => file._id !== fileId));
      message.success("Xóa file thành công");
    } catch (error) {
      message.error("Lỗi khi xóa file");
      console.error("Error:", error);
    }
  };

  return (
    <AdminLayout title="Cập nhật bài viết">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}
      >
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input placeholder="Nhập tiêu đề bài viết" />
        </Form.Item>

        <Form.Item
          name="content"
          label="Nội dung"
          rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
        >
          <TextArea 
            rows={6} 
            placeholder="Nhập nội dung bài viết"
          />
        </Form.Item>

        <Form.Item
          name="post_category_id"
          label="Danh mục"
          rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
        >
          <Select placeholder="Chọn danh mục">
            {categories.map(category => (
              <Select.Option key={category._id} value={category._id}>
                {category.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="Trạng thái"
        >
          <Select>
            <Select.Option value="active">Hoạt động</Select.Option>
            <Select.Option value="inactive">Không hoạt động</Select.Option>
            <Select.Option value="draft">Bản nháp</Select.Option>
          </Select>
        </Form.Item>

        {existingFiles.length > 0 && (
          <Form.Item label="Files hiện tại">
            <List
              dataSource={existingFiles}
              renderItem={file => (
                <List.Item
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteFile(file._id)}
                    >
                      Xóa
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={file.file_name}
                    description={`Loại file: ${file.file_type}`}
                  />
                </List.Item>
              )}
            />
          </Form.Item>
        )}

        <Form.Item label="Thêm files mới">
          <Upload
            listType="picture"
            multiple
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />}>Chọn files</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={() => navigate("/admin/post")}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Cập nhật
            </Button>
          </div>
        </Form.Item>
      </Form>
    </AdminLayout>
  );
};

export default UpdatePost;