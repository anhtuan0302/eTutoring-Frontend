import React, { useEffect, useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { getCourseCategoryByID, updateCourseCategory } from "../../../../api/education/courseCategory";
import AdminLayout from "../../../../components/layouts/admin/layout";

const UpdateCourseCategory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [coursecategory, setCourseCategories] = useState(null);

  useEffect(() => {
    const fetchCourseCategory = async () => {
      try {
        console.log('Fetching course category with ID:', id);
        const data = await getCourseCategoryByID(id);
        console.log('Received data:', data);
        setCourseCategories(data);
        form.setFieldsValue(data);
      } catch (error) {
        console.error("Chi tiết lỗi:", error);
        message.error("Lỗi khi lấy thông tin course category");
      }
    };
    
    if (id) {
      fetchCourseCategory();
    }
  }, [id, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log('Sending update with data:', {
        _id: id,
        ...values
      });
      
      await updateCourseCategory({
        _id: id,
        ...values
      });
      message.success("Cập nhật course category thành công!");
      navigate("/admin/course_category");
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      message.error("Cập nhật thất bại: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!coursecategory) {
    return <div>Loading course category data...</div>;
  }

  return (
    <AdminLayout title="Update Course Category">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Course Category Name"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên course category!" }]}
        >
          <Input placeholder="Nhập tên course category" />
        </Form.Item>

        <Form.Item 
          label="Mô tả" 
          name="description"
        >
          <Input.TextArea placeholder="Nhập mô tả course category" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Cập nhật
          </Button>
          <Button 
            style={{ marginLeft: 8 }} 
            onClick={() => navigate("/admin/course_category")}
          >
            Hủy
          </Button>
        </Form.Item>
      </Form>
    </AdminLayout>
  );
};

export default UpdateCourseCategory;