import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../Header/Header';
import { getEnrollmentsForCourse, approveEnrollment, rejectEnrollment, resetStudentPassword } from '../Api/UserAPI';
import './UserList.css';

const UserList = () => {
    const { classId } = useParams();
    const [enrolledUsers, setEnrolledUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!classId) {
                console.error("classId가 없어 유저 목록을 불러올 수 없습니다.");
                setLoading(false);
                return;
            }
            const data = await getEnrollmentsForCourse(classId);
            const pending = data.filter(enrollment => enrollment.status.toUpperCase() === 'PENDING');
            const enrolled = data.filter(enrollment => enrollment.status.toUpperCase() === 'APPROVED');
            setPendingUsers(pending);
            setEnrolledUsers(enrolled);
        } catch (err) {
            setError(err);
            console.error('Error fetching enrollments:', err);
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        if (!classId) {
            // classId가 없을 경우에 대한 처리를 명확하게 할 수 있습니다.
            // 예를 들어, 에러 상태를 설정하거나 로딩을 중단할 수 있습니다.
        }
        fetchData();
    }, [classId, fetchData]);

    const handleApprove = async (enrollmentId, userName) => {
        if (!classId || !enrollmentId) {
            alert("강좌 또는 수강 신청 정보가 유효하지 않습니다. 페이지를 새로고침해주세요.");
            return;
        }

        if (window.confirm(`유저 "${userName}"의 수강 신청을 수락하시겠습니까?`)) {
            try {
                await approveEnrollment(classId, enrollmentId);
                alert(`"${userName}" 유저의 수강 신청이 수락되었습니다.`);
                fetchData();
            } catch (err) {
                alert(`수락 처리에 실패했습니다: ${err.message}`);
                console.error('Error approving enrollment:', err);
            }
        }
    };

    const handleReject = async (enrollmentId, userName) => {
        if (!classId || !enrollmentId) {
            alert("강좌 또는 수강 신청 정보가 유효하지 않습니다. 페이지를 새로고침해주세요.");
            return;
        }

        if (window.confirm(`유저 "${userName}"의 수강 신청을 거절하시겠습니까?`)) {
            try {
                await rejectEnrollment(classId, enrollmentId);
                alert(`"${userName}" 유저의 수강 신청이 거절되었습니다.`);
                fetchData();
            } catch (err) {
                alert(`거절 처리에 실패했습니다: ${err.message}`);
                console.error('Error rejecting enrollment:', err);
            }
        }
    };

    const handleRemoveEnrollment = async (e, enrollmentId, userName) => {
        e.stopPropagation();
        if (!classId || !enrollmentId) {
            alert("강좌 또는 수강 신청 정보가 유효하지 않습니다. 페이지를 새로고침해주세요.");
            return;
        }

        if (window.confirm(`"${userName}" 유저를 이 강좌 수강 목록에서 제외하시겠습니까?`)) {
            try {
                // 수강생 제외는 거절 API와 동일한 로직을 사용할 수 있습니다.
                await rejectEnrollment(classId, enrollmentId);
                alert(`"${userName}" 유저가 강좌 수강 목록에서 제외되었습니다.`);
                fetchData();
            } catch (err) {
                alert(`제외 처리에 실패했습니다: ${err.message}`);
                console.error('Error removing enrollment:', err);
            }
        }
    };

    const handleResetPassword = async (e, studentId, userName) => {
        e.stopPropagation();
        if (window.confirm(`"${userName}" 학생의 비밀번호를 정말로 초기화하시겠습니까?`)) {
            try {
                await resetStudentPassword(studentId);
                alert(`"${userName}" 학생의 비밀번호가 초기화되었습니다.`);
            } catch (err) {
                alert(`비밀번호 초기화에 실패했습니다: ${err.message}`);
                console.error('Error resetting password:', err);
            }
        }
    };

    if (loading) return <div className="userlist-loading-message">유저 목록을 불러오는 중...</div>;
    if (error) {
        return (
            <div className="userlist-error-message">
                오류 발생: {error.message || '알 수 없는 오류'}
            </div>
        );
    }

    return (
        <>
            <Header />
            <div className="userlist-user-list-container">
                <div className="userlist-user-list-header">
                    <h2> 수강 중인 유저</h2>
                </div>
                <div className="userlist-user-boxes-grid">
                    {enrolledUsers.length === 0 ? (
                        <div className="userlist-no-data-message">이 강좌에 수강 중인 유저가 없습니다.</div>
                    ) : (
                        enrolledUsers.map((enrollment) => (
                            <div key={enrollment.id} className="userlist-user-list-item">
                                <div className="userlist-user-info">
                                    <div className="userlist-user-username">{enrollment.name}</div>
                                    <p className="userlist-user-id">{enrollment.username}</p>
                                </div>
                                <div className="userlist-user-actions">
                                    <button
                                        className="userlist-reset-btn"
                                        onClick={(e) => handleResetPassword(e, enrollment.user_id, enrollment.name)}
                                    >
                                        비번 초기화
                                    </button>
                                    <button
                                        className="userlist-delete-btn"
                                        onClick={(e) => handleRemoveEnrollment(e, enrollment.id, enrollment.name)}
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                <div className="userlist-user-list-header" style={{ marginTop: '40px' }}>
                    <h2> 수강 신청 대기 유저</h2>
                </div>
                <div className="userlist-user-boxes-grid">
                    {pendingUsers.length === 0 ? (
                        <div className="userlist-no-data-message">수강 신청 대기 중인 유저가 없습니다.</div>
                    ) : (
                        pendingUsers.map((enrollment) => (
                            <div key={enrollment.id} className="userlist-user-list-item">
                                <div className="userlist-user-info">
                                    <div className="userlist-user-username">{enrollment.name}</div>
                                    <p className="userlist-user-id">{enrollment.username}</p>
                                </div>
                                <div className="userlist-user-actions">
                                    <button
                                        className="userlist-accept-btn"
                                        onClick={() => handleApprove(enrollment.id, enrollment.name)}
                                    >
                                        수락
                                    </button>
                                    <button
                                        className="userlist-reject-btn"
                                        onClick={() => handleReject(enrollment.id, enrollment.name)}
                                    >
                                        거절
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default UserList;