const express = require('express');
const router = express.Router();
const db = require('../database/db');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 숙소 조회
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/accommodations', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, type, description, price_per_night, max_guests, amenities, image_url
            FROM accommodations
            WHERE is_active = true
            ORDER BY price_per_night ASC
        `);

        res.json({
            success: true,
            count: result.rows.length,
            accommodations: result.rows
        });
    } catch (error) {
        console.error('숙소 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: 'accommodations_fetch_failed',
            message: '숙소 목록을 불러오는데 실패했습니다'
        });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 활동 조회
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/activities', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, category, description, price, duration_minutes, max_participants, location, image_url
            FROM activities
            WHERE is_active = true
            ORDER BY category, price ASC
        `);

        res.json({
            success: true,
            count: result.rows.length,
            activities: result.rows
        });
    } catch (error) {
        console.error('활동 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: 'activities_fetch_failed',
            message: '활동 목록을 불러오는데 실패했습니다'
        });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 패키지 조회 (숙소 + 활동)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/packages', async (req, res) => {
    try {
        const [accommodations, activities] = await Promise.all([
            db.query(`
                SELECT id, name, type, description, price_per_night, max_guests, amenities, image_url
                FROM accommodations
                WHERE is_active = true
                ORDER BY price_per_night ASC
            `),
            db.query(`
                SELECT id, name, category, description, price, duration_minutes, max_participants, location, image_url
                FROM activities
                WHERE is_active = true
                ORDER BY category, price ASC
            `)
        ]);

        res.json({
            success: true,
            packages: {
                accommodations: accommodations.rows,
                activities: activities.rows
            },
            stats: {
                accommodations_count: accommodations.rows.length,
                activities_count: activities.rows.length
            }
        });
    } catch (error) {
        console.error('패키지 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: 'packages_fetch_failed',
            message: '패키지 정보를 불러오는데 실패했습니다'
        });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 견적 계산
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/quotes/calculate', async (req, res) => {
    try {
        const {
            accommodation_id,
            check_in_date,
            check_out_date,
            num_guests,
            activity_ids = []
        } = req.body;

        // 입력 검증
        if (!accommodation_id || !check_in_date || !check_out_date || !num_guests) {
            return res.status(400).json({
                success: false,
                error: 'missing_required_fields',
                message: '필수 항목이 누락되었습니다'
            });
        }

        // 숙박일수 계산
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        if (nights <= 0) {
            return res.status(400).json({
                success: false,
                error: 'invalid_dates',
                message: '체크아웃 날짜는 체크인 날짜보다 늦어야 합니다'
            });
        }

        // 숙소 정보 조회
        const accomResult = await db.query(
            'SELECT * FROM accommodations WHERE id = $1 AND is_active = true',
            [accommodation_id]
        );

        if (accomResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'accommodation_not_found',
                message: '숙소를 찾을 수 없습니다'
            });
        }

        const accommodation = accomResult.rows[0];

        // 숙박비 계산
        const accommodation_price = accommodation.price_per_night * nights;

        // 활동비 계산
        let activities_price = 0;
        let selected_activities = [];

        if (activity_ids.length > 0) {
            const actResult = await db.query(
                'SELECT * FROM activities WHERE id = ANY($1) AND is_active = true',
                [activity_ids]
            );

            selected_activities = actResult.rows;
            activities_price = selected_activities.reduce((sum, act) => sum + act.price, 0) * num_guests;
        }

        // 총 금액
        const total_price = accommodation_price + activities_price;

        res.json({
            success: true,
            quote: {
                accommodation: {
                    id: accommodation.id,
                    name: accommodation.name,
                    type: accommodation.type,
                    price_per_night: accommodation.price_per_night,
                    nights: nights,
                    total: accommodation_price
                },
                activities: selected_activities.map(act => ({
                    id: act.id,
                    name: act.name,
                    category: act.category,
                    price_per_person: act.price,
                    participants: num_guests,
                    total: act.price * num_guests
                })),
                summary: {
                    check_in_date,
                    check_out_date,
                    nights,
                    num_guests,
                    accommodation_price,
                    activities_price,
                    total_price
                }
            }
        });
    } catch (error) {
        console.error('견적 계산 오류:', error);
        res.status(500).json({
            success: false,
            error: 'quote_calculation_failed',
            message: '견적 계산에 실패했습니다'
        });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 예약 생성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/bookings', async (req, res) => {
    try {
        const {
            accommodation_id,
            guest_name,
            guest_email,
            guest_phone,
            num_guests,
            check_in_date,
            check_out_date,
            activity_ids = [],
            special_requests = ''
        } = req.body;

        // 입력 검증
        if (!accommodation_id || !guest_name || !guest_email || !guest_phone || !num_guests || !check_in_date || !check_out_date) {
            return res.status(400).json({
                success: false,
                error: 'missing_required_fields',
                message: '필수 항목이 누락되었습니다'
            });
        }

        // 숙박일수 계산
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        // 숙소 정보 조회
        const accomResult = await db.query(
            'SELECT * FROM accommodations WHERE id = $1 AND is_active = true',
            [accommodation_id]
        );

        if (accomResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'accommodation_not_found',
                message: '숙소를 찾을 수 없습니다'
            });
        }

        const accommodation = accomResult.rows[0];
        const accommodation_price = accommodation.price_per_night * nights;

        // 활동비 계산
        let activities_price = 0;
        let selected_activities = [];

        if (activity_ids.length > 0) {
            const actResult = await db.query(
                'SELECT * FROM activities WHERE id = ANY($1) AND is_active = true',
                [activity_ids]
            );
            selected_activities = actResult.rows;
            activities_price = selected_activities.reduce((sum, act) => sum + act.price, 0) * num_guests;
        }

        const total_price = accommodation_price + activities_price;

        // 예약 생성 (트랜잭션)
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // 예약 삽입
            const bookingResult = await client.query(
                `INSERT INTO bookings (
                    accommodation_id, guest_name, guest_email, guest_phone, num_guests,
                    check_in_date, check_out_date, accommodation_price, activities_price, total_price,
                    special_requests, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *`,
                [
                    accommodation_id, guest_name, guest_email, guest_phone, num_guests,
                    check_in_date, check_out_date, accommodation_price, activities_price, total_price,
                    special_requests, 'pending'
                ]
            );

            const booking = bookingResult.rows[0];

            // 예약별 활동 삽입
            if (selected_activities.length > 0) {
                for (const activity of selected_activities) {
                    await client.query(
                        `INSERT INTO booking_activities (booking_id, activity_id, scheduled_date, num_participants, price)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [booking.id, activity.id, check_in_date, num_guests, activity.price * num_guests]
                    );
                }
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                booking: {
                    id: booking.id,
                    status: booking.status,
                    guest_name: booking.guest_name,
                    check_in_date: booking.check_in_date,
                    check_out_date: booking.check_out_date,
                    total_price: booking.total_price,
                    created_at: booking.created_at
                },
                message: '예약이 접수되었습니다'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('예약 생성 오류:', error);
        res.status(500).json({
            success: false,
            error: 'booking_creation_failed',
            message: '예약 접수에 실패했습니다'
        });
    }
});

module.exports = router;
