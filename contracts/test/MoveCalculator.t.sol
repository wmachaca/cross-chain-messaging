// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/libraries/MoveCalculator.sol";

contract MoveCalculatorTest is Test {
    using MoveCalculator for uint256;

    function testMoveCalculation() public {
        // Test calculateMove
        assertEq(uint256(MoveCalculator.calculateMove(3)), uint256(MoveCalculator.Move.Paper));
        assertEq(uint256(MoveCalculator.calculateMove(4)), uint256(MoveCalculator.Move.Scissors));
        assertEq(uint256(MoveCalculator.calculateMove(5)), uint256(MoveCalculator.Move.Rock));
    }

    function testDetermineWinner() public {
        // Test determineWinner
        assertEq(MoveCalculator.determineWinner(MoveCalculator.Move.Rock, MoveCalculator.Move.Scissors), 1);
        assertEq(MoveCalculator.determineWinner(MoveCalculator.Move.Paper, MoveCalculator.Move.Rock), 1);
        assertEq(MoveCalculator.determineWinner(MoveCalculator.Move.Scissors, MoveCalculator.Move.Paper), 1);

        assertEq(MoveCalculator.determineWinner(MoveCalculator.Move.Rock, MoveCalculator.Move.Paper), 2);
        assertEq(MoveCalculator.determineWinner(MoveCalculator.Move.Paper, MoveCalculator.Move.Scissors), 2);
        assertEq(MoveCalculator.determineWinner(MoveCalculator.Move.Scissors, MoveCalculator.Move.Rock), 2);

        assertEq(MoveCalculator.determineWinner(MoveCalculator.Move.Rock, MoveCalculator.Move.Rock), 0);
        assertEq(MoveCalculator.determineWinner(MoveCalculator.Move.Paper, MoveCalculator.Move.Paper), 0);
        assertEq(MoveCalculator.determineWinner(MoveCalculator.Move.Scissors, MoveCalculator.Move.Scissors), 0);
    }
}
