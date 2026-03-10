// src/admin/SubmitUser.js

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../Header/Header';
import { getSubmitUserList, exportCourseScoresAsCsv } from '../Api/SubmitAPI';
import './SubmitUser.css';

const SubmitUser = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { classId } = useParams();

    const getUsers = useCallback(async () => {
        if (!classId) {
            setError('강좌 ID가 URL에 없습니다. 올바른 경로로 접근해주세요.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await getSubmitUserList(classId); 
            setUsers(data);
        } catch (err) {
            setError('유저 목록을 불러오는 데 실패했습니다: ');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        getUsers();
    }, [getUsers]);

    const handleExportAllScores = async () => {
        if (loading || error) {
            alert("목록을 로드하는 중에는 내보낼 수 없습니다.");
            return;
        }
        try {
            const blob = await exportCourseScoresAsCsv(classId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `course_${classId}_all_scores.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("CSV 파일을 내보내는 중 오류가 발생했습니다.");
            console.error(err);
        }
    };

    const handleUserClick = (userId) => {
        navigate(`/admin/classes/${classId}/submits/${userId}`);
    };

    if (loading) return <div className="submituser-loading-message">유저 목록을 불러오는 중...</div>;
    if (error) {
        return (
            <div className="submituser-error-message">
                <p>오류 : {error}</p>
            </div>
        );
    }

    return (
        <>
            <Header />
            <div className="submituser-submission-wrapper">
                <div className="submituser-submission-header">
                    <h2> 유저 제출 현황</h2>
                    <div className="submituser-header-buttons">
                        <button className="submituser-export-button" onClick={handleExportAllScores}>
                            강좌 전체 점수 내보내기
                        </button>
                    </div>
                </div>

                <div className="submituser-submission-list">
                    {users.length === 0 ? (
                        <div className="submituser-no-submissions-message">제출 기록이 있는 유저가 없습니다.</div>
                    ) : (
                        users.map(user => (
                            <div
                                key={user.user_id}
                                className="submituser-submission-item"
                                onClick={() => handleUserClick(user.user_id)}
                            >
                                <div className="submituser-user-info">
                                    <div className="submituser-user-name">{user.name} ({user.username})</div>
                                </div>
                                <div className="submituser-submission-actions">
                                    <span className="submituser-user-score">총점: {user.total_score}점</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default SubmitUser;